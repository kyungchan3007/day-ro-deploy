package com.dayro.situation.service.ai;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.global.quota.DailyCallBudget;
import com.dayro.situation.domain.Purpose;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ResponseEntity;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

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
    private final ApplicationEventPublisher eventPublisher;

    @Value("${quota.gemini.daily-limit:50}")
    private long dailyLimit;

    @Value("${spring.ai.google.genai.chat.options.model}")
    private String primaryModel;

    // 기본 모델이 503(high demand)/타임아웃으로 실패하면 한 번만 이 모델로 다시 시도한다 - 비우면 폴백 없이 바로 실패
    @Value("${ai.gemini.fallback-model:}")
    private String fallbackModel;

    public CoursePlaceSelector(ChatClient.Builder chatClientBuilder, DailyCallBudget dailyCallBudget,
                               ApplicationEventPublisher eventPublisher) {
        this.chatClient = chatClientBuilder.build();
        this.dailyCallBudget = dailyCallBudget;
        this.eventPublisher = eventPublisher;
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
            return call(primaryModel, userPrompt, purpose, candidates.size());
        } catch (RuntimeException e) {
            if (!StringUtils.hasText(fallbackModel) || fallbackModel.equals(primaryModel)) {
                throw e;
            }
            log.warn("기본 모델({}) 실패 - 폴백 모델({})로 재시도", primaryModel, fallbackModel);
            return call(fallbackModel, userPrompt, purpose, candidates.size());
        }
    }

    private List<String> call(String model, String userPrompt, Purpose purpose, int candidateCount) {
        long startedAt = System.currentTimeMillis();
        try {
            // entity()만 쓰면 토큰 사용량(비용 산출 근거)이 버려지므로 ChatResponse를 함께 받는다
            ResponseEntity<ChatResponse, SelectionResult> response = chatClient.prompt()
                    .options(GoogleGenAiChatOptions.builder().model(model).build())
                    .system(SYSTEM_PROMPT)
                    .user(userPrompt)
                    .call()
                    .responseEntity(SelectionResult.class);
            SelectionResult result = response.entity();
            publishApiCall(model, true, response.response(), startedAt);
            List<String> orderedPlaceIds = result == null || result.orderedPlaceIds() == null ? List.of() : result.orderedPlaceIds();
            // 캐시 적중 시에는 실행되지 않으므로, 이 로그가 찍힌 횟수 = 실제 Gemini 호출 수다
            log.info("Gemini 장소 선별 호출 - model: {}, purpose: {}, 후보 {}개 -> {}개 선택, {}ms",
                    model, purpose, candidateCount, orderedPlaceIds.size(), System.currentTimeMillis() - startedAt);
            return orderedPlaceIds;
        } catch (RuntimeException e) {
            log.warn("AI 장소 선별 호출 실패 - model: {}, {}ms", model, System.currentTimeMillis() - startedAt, e);
            publishApiCall(model, false, null, startedAt);
            throw e;
        }
    }

    // 캐시 적중 시에는 이 메서드 자체가 실행되지 않으므로 기록된 건수 = 실제 과금 호출 수
    private void publishApiCall(String model, boolean success, ChatResponse chatResponse, long startedAt) {
        Usage usage = chatResponse == null || chatResponse.getMetadata() == null ? null : chatResponse.getMetadata().getUsage();
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.EXTERNAL_API_CALL, null, ActivityOccurredEvent.metadata(
                "api", "gemini-course-selection",
                "model", model,
                "success", success,
                "promptTokens", usage == null ? null : usage.getPromptTokens(),
                "completionTokens", usage == null ? null : usage.getCompletionTokens(),
                "totalTokens", usage == null ? null : usage.getTotalTokens(),
                "elapsedMs", System.currentTimeMillis() - startedAt)));
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
