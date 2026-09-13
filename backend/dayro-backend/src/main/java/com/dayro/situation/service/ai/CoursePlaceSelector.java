package com.dayro.situation.service.ai;

import com.dayro.global.quota.DailyCallBudget;
import com.dayro.situation.domain.Purpose;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

import static com.dayro.global.config.RedisCacheConfig.COURSE_PLACE_SELECTION_CACHE;

// 필터링된 장소 후보 중 목적(Purpose) 기준에 맞는 곳을 골라 방문 순서대로 정렬 - 기획안(26.07.14 Updated) slide 5/7 정책 반영
@Component
@Slf4j
public class CoursePlaceSelector {

    private static final String SYSTEM_PROMPT = """
            너는 데이트 코스 추천 서비스의 장소 선별 담당 AI다.
            아래 규칙을 반드시 지켜서 입력된 후보 장소 중 일부를 골라, 방문하기 좋은 순서대로 정렬한 placeId 리스트만 반환해라.

            규칙:
            - targetCount 값만큼 정확히 선택할 것. 후보가 부족하면 있는 만큼만 선택할 것.
            - 선택한 장소를 순서대로 나열했을 때 동일한 category가 연속으로 2개 이상 나오지 않게 할 것.
            - purpose 값에 따라 아래 기준을 우선적으로 고려해서 고를 것.
              - BLIND_DATE(소개팅): 테이블 간격이 넓고 조용하며 역 접근성이 좋아 보이는 곳
              - ANNIVERSARY(기념일): 평점이 높고(4.5 이상 우선) 사진이 잘 나올 것 같은(포토제닉) 곳, 리뷰 수가 많은 곳
              - CASUAL_DATE(평상 데이트): 트렌디하고 인기 있어 보이는 곳(웨이팅이 있을 수 있음을 감안)
              - FRIENDS(친구): 여러 명이 함께 앉기 좋아 보이는 곳, 주변에 놀거리가 있을 것 같은 곳
            - editorialSummary(장소 설명)가 있다면 분위기 판단에 참고할 것.
            """;

    private final ChatClient chatClient;
    private final DailyCallBudget dailyCallBudget;

    @Value("${quota.gemini.daily-limit:50}")
    private long dailyLimit;

    public CoursePlaceSelector(ChatClient.Builder chatClientBuilder, DailyCallBudget dailyCallBudget) {
        this.chatClient = chatClientBuilder.build();
        this.dailyCallBudget = dailyCallBudget;
    }

    public record SelectionResult(List<String> orderedPlaceIds) {
    }

    // 같은 후보 집합(=같은 Places 캐시)에 대해 purpose/targetCount가 같으면 결정적인 선택이라 캐싱 - Gemini 재호출 방지
    // "다른 코스 보기" 재생성 시에는 bypassCache=true로 넘어와 캐시 조회/저장을 건너뛰고 매번 새로 호출한다
    @Cacheable(value = COURSE_PLACE_SELECTION_CACHE,
            key = "#purpose + ':' + #targetCount + ':' + #candidates.![placeId].toString()",
            condition = "!#bypassCache",
            unless = "#result.isEmpty()")
    public List<String> select(List<PlaceCandidateDraft> candidates, Purpose purpose, int targetCount, boolean bypassCache) {
        dailyCallBudget.consume("gemini-course-selection", dailyLimit);
        String userPrompt = """
                purpose: %s
                targetCount: %d
                candidates:
                %s
                """.formatted(purpose, targetCount, toPromptLines(candidates));

        try {
            SelectionResult result = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .entity(SelectionResult.class);
            return result == null || result.orderedPlaceIds() == null ? List.of() : result.orderedPlaceIds();
        } catch (Exception e) {
            log.warn("AI 장소 선별 호출 실패", e);
            throw e;
        }
    }

    private String toPromptLines(List<PlaceCandidateDraft> candidates) {
        StringBuilder sb = new StringBuilder();
        for (PlaceCandidateDraft c : candidates) {
            sb.append("- placeId=%s, name=%s, category=%s, rating=%s, userRatingCount=%s, editorialSummary=%s\n"
                    .formatted(
                            c.placeId(),
                            c.name(),
                            c.category().label(),
                            c.rating(),
                            c.userRatingCount(),
                            c.editorialSummary() == null ? "" : c.editorialSummary()
                    ));
        }
        return sb.toString();
    }
}
