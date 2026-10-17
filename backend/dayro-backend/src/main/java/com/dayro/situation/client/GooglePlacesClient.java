package com.dayro.situation.client;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.global.quota.DailyCallBudget;
import com.dayro.situation.dto.external.PlaceSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.ClientHttpRequestFactories;
import org.springframework.boot.web.client.ClientHttpRequestFactorySettings;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import static com.dayro.global.config.RedisCacheConfig.PLACES_SEARCH_CACHE;

import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;

// Google Places API (New) Text Search 연동 - https://developers.google.com/maps/documentation/places/web-service/text-search
@Component
@RequiredArgsConstructor
@Slf4j
public class GooglePlacesClient {

    private static final String URL = "https://places.googleapis.com/v1/places:searchText";
    // skipHttpRedirect를 지정하지 않으면 실제 이미지 바이너리로 302 리다이렉트되고, RestClient가 이를 그대로 따라가 바이너리를 받아온다
    private static final String PHOTO_MEDIA_URL = "https://places.googleapis.com/v1/%s/media?maxWidthPx=%d";
    private static final String FIELD_MASK = String.join(",",
            "places.id",
            "places.displayName",
            "places.types",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.regularOpeningHours",
            "places.editorialSummary",
            "places.photos"
    );
    private static final int MAX_RESULT_COUNT = 10;
    private static final int PHOTO_MAX_WIDTH_PX = 800;
    // Places Photo의 photoName 형식: places/{placeId}/photos/{photoReference}
    private static final Pattern PHOTO_NAME_PATTERN = Pattern.compile("^places/[A-Za-z0-9_=-]+/photos/[A-Za-z0-9_=-]+$");

    private final RestClient restClient = RestClient.builder()
            .requestFactory(ClientHttpRequestFactories.get(
                    ClientHttpRequestFactorySettings.DEFAULTS
                            .withConnectTimeout(Duration.ofSeconds(3))
                            .withReadTimeout(Duration.ofSeconds(5))))
            .build();

    @Value("${google.places.api-key}")
    private String apiKey;

    @Value("${quota.places.daily-limit:350}")
    private long dailyLimit;

    // Places Photo는 1,000건당 약 $7로 Text Search보다 비싸고 사용자 한 명이 코스를 한 번 볼 때마다 여러 장을 부르므로 별도 한도로 관리
    @Value("${quota.places.photo-daily-limit:300}")
    private long photoDailyLimit;

    private final DailyCallBudget dailyCallBudget;
    private final ApplicationEventPublisher eventPublisher;

    private record TextSearchRequest(String textQuery, String languageCode, int maxResultCount) {
    }

    // query(지역+카테고리 조합)는 유한하고 결과도 자주 안 바뀌므로 캐싱 - 실패로 빈 리스트가 반환된 경우는 캐시하지 않음
    @Cacheable(value = PLACES_SEARCH_CACHE, key = "#query", unless = "#result.isEmpty()")
    public List<PlaceSearchResponse.Place> searchText(String query) {
        dailyCallBudget.consume("google-places", dailyLimit);
        long startedAt = System.currentTimeMillis();
        try {
            PlaceSearchResponse response = restClient
                    .post()
                    .uri(URL)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", FIELD_MASK)
                    .body(new TextSearchRequest(query, "ko", MAX_RESULT_COUNT))
                    .retrieve()
                    .body(PlaceSearchResponse.class);
            List<PlaceSearchResponse.Place> places = response == null || response.places() == null ? List.of() : response.places();
            // 캐시 적중 시에는 이 메서드 본문이 실행되지 않으므로, 이 로그가 찍힌 횟수 = 실제 과금된 Places 호출 수다
            log.info("Places 검색 호출 - query: {}, 결과 {}건(사진 있음 {}건), {}ms",
                    query, places.size(), places.stream().filter(p -> p.photos() != null && !p.photos().isEmpty()).count(),
                    System.currentTimeMillis() - startedAt);
            publishApiCall("google-places-search", true, startedAt);
            return places;
        } catch (Exception e) {
            log.warn("Google Places 조회 실패 - query: {}", query, e);
            publishApiCall("google-places-search", false, startedAt);
            return List.of();
        }
    }

    public record Photo(byte[] data, MediaType contentType) {
    }

    // API 키는 서버 쪽에만 남기고 이미지 바이너리만 클라이언트로 전달한다.
    // Places Photo는 캐시가 없는 호출당 과금이고 /api/places/photo가 비로그인 공개라, 여기서 반드시 일일 한도를 태운다
    public Photo fetchPhoto(String photoName) {
        if (photoName == null || !PHOTO_NAME_PATTERN.matcher(photoName).matches()) {
            // 검증 없이 URL에 그대로 끼워 넣으면 쿼리스트링/경로를 조작해 다른 Places 엔드포인트를 호출시킬 수 있다
            log.warn("허용되지 않은 photoName 형식 - photoName: {}", photoName);
            throw new BusinessException(ErrorCode.PLACE_PHOTO_NOT_FOUND);
        }

        dailyCallBudget.consume("google-places-photo", photoDailyLimit);

        long startedAt = System.currentTimeMillis();
        ResponseEntity<byte[]> response;
        try {
            response = restClient
                    .get()
                    .uri(PHOTO_MEDIA_URL.formatted(photoName, PHOTO_MAX_WIDTH_PX))
                    .header("X-Goog-Api-Key", apiKey)
                    .retrieve()
                    .toEntity(byte[].class);
        } catch (Exception e) {
            log.warn("Google Places 사진 조회 실패 - photoName: {}", photoName, e);
            publishApiCall("google-places-photo", false, startedAt);
            throw new BusinessException(ErrorCode.PLACE_PHOTO_NOT_FOUND);
        }

        publishApiCall("google-places-photo", true, startedAt);
        byte[] body = response.getBody();
        if (body == null || body.length == 0) {
            throw new BusinessException(ErrorCode.PLACE_PHOTO_NOT_FOUND);
        }
        // 구글 응답 헤더를 그대로 흘려보내지 않고 Content-Type만 가져온다
        MediaType contentType = response.getHeaders().getContentType();
        return new Photo(body, contentType == null ? MediaType.IMAGE_JPEG : contentType);
    }

    // 코스 1건당 비용 산출용 - 캐시 적중 시에는 호출되지 않으므로 기록 건수 = 실제 과금 호출 수
    private void publishApiCall(String api, boolean success, long startedAt) {
        eventPublisher.publishEvent(ActivityOccurredEvent.of(ActivityEventType.EXTERNAL_API_CALL, null, ActivityOccurredEvent.metadata(
                "api", api,
                "success", success,
                "elapsedMs", System.currentTimeMillis() - startedAt)));
    }
}
