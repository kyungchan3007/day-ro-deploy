package com.dayro.situation.client;

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
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import static com.dayro.global.config.RedisCacheConfig.PLACES_SEARCH_CACHE;

import java.time.Duration;
import java.util.List;

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

    private final DailyCallBudget dailyCallBudget;

    private record TextSearchRequest(String textQuery, String languageCode, int maxResultCount) {
    }

    // query(지역+카테고리 조합)는 유한하고 결과도 자주 안 바뀌므로 캐싱 - 실패로 빈 리스트가 반환된 경우는 캐시하지 않음
    @Cacheable(value = PLACES_SEARCH_CACHE, key = "#query", unless = "#result.isEmpty()")
    public List<PlaceSearchResponse.Place> searchText(String query) {
        dailyCallBudget.consume("google-places", dailyLimit);
        try {
            PlaceSearchResponse response = restClient
                    .post()
                    .uri(URL)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", FIELD_MASK)
                    .body(new TextSearchRequest(query, "ko", MAX_RESULT_COUNT))
                    .retrieve()
                    .body(PlaceSearchResponse.class);
            return response == null || response.places() == null ? List.of() : response.places();
        } catch (Exception e) {
            log.warn("Google Places 조회 실패 - query: {}", query, e);
            return List.of();
        }
    }

    // 클라이언트에는 이 원본 응답을 그대로 전달만 하고, API 키는 서버 쪽에만 남긴다
    public ResponseEntity<byte[]> fetchPhoto(String photoName) {
        try {
            return restClient
                    .get()
                    .uri(PHOTO_MEDIA_URL.formatted(photoName, PHOTO_MAX_WIDTH_PX))
                    .header("X-Goog-Api-Key", apiKey)
                    .retrieve()
                    .toEntity(byte[].class);
        } catch (Exception e) {
            log.warn("Google Places 사진 조회 실패 - photoName: {}", photoName, e);
            throw new BusinessException(ErrorCode.PLACE_PHOTO_NOT_FOUND);
        }
    }
}
