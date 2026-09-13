package com.dayro.situation.service.impl;

import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.situation.client.GooglePlacesClient;
import com.dayro.situation.domain.CourseRequestSession;
import com.dayro.situation.domain.PlaceCategory;
import com.dayro.situation.domain.Purpose;
import com.dayro.situation.domain.Region;
import com.dayro.situation.dto.external.PlaceSearchResponse;
import com.dayro.situation.dto.request.SituationInputRequest;
import com.dayro.situation.dto.response.CourseCandidateResponse;
import com.dayro.situation.dto.response.CourseCandidateResponse.PlaceCandidate;
import com.dayro.situation.repository.RegionRepository;
import com.dayro.situation.service.CourseRecommendationService;
import com.dayro.situation.service.CourseRequestSessionStore;
import com.dayro.situation.service.ai.CoursePlaceSelector;
import com.dayro.situation.service.ai.PlaceCandidateDraft;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

// AI 기반 장소 추천 - 기획안(26.07.14 Updated v0.6) "코스생성 정책"·"필터 정책" 반영
@Service
@RequiredArgsConstructor
@Slf4j
public class CourseRecommendationServiceImpl implements CourseRecommendationService {

    private final RegionRepository regionRepository;
    private final GooglePlacesClient googlePlacesClient;
    private final CoursePlaceSelector coursePlaceSelector;
    private final CourseRequestSessionStore sessionStore;

    private record CandidatePlace(PlaceSearchResponse.Place place, PlaceCategory category) {
    }

    @Override
    public CourseCandidateResponse recommend(SituationInputRequest request) {
        Region region = regionRepository.findByDistrictId(request.districtId())
                .orElseThrow(() -> new BusinessException(ErrorCode.REGION_NOT_FOUND));

        List<CandidatePlace> openCandidates = openCandidates(region, request.startTime(), request.endTime());
        int targetCount = resolveTargetCount(request.startTime(), request.endTime());

        List<String> orderedIds = selectOrderedIds(openCandidates, request.purpose(), targetCount, false);
        List<PlaceCandidate> places = buildPlaces(openCandidates, orderedIds, targetCount, region, request.startTime(), request.endTime());

        String requestId = sessionStore.create(request, places.stream().map(PlaceCandidate::placeId).toList());
        return new CourseCandidateResponse(places, requestId, sessionStore.retryLimit());
    }

    // "다른 코스 보기" - 저장된 조건으로 후보를 다시 조회(Places 캐시 재사용)하되, 이미 보여준 장소를 제외하고 Gemini는 캐시 우회해 새로 호출한다.
    // 제외 후 targetCount를 못 채우면(지역이 작아 대안이 적은 경우) 이미 보여준 장소도 재사용을 허용해 우아하게 채운다.
    @Override
    public CourseCandidateResponse retry(String requestId) {
        CourseRequestSession session = sessionStore.get(requestId);
        if (session.retryCount() >= sessionStore.retryLimit()) {
            throw new BusinessException(ErrorCode.COURSE_RETRY_LIMIT_EXCEEDED);
        }

        Region region = regionRepository.findByDistrictId(session.districtId())
                .orElseThrow(() -> new BusinessException(ErrorCode.REGION_NOT_FOUND));

        List<CandidatePlace> openCandidates = openCandidates(region, session.startTime(), session.endTime());
        int targetCount = resolveTargetCount(session.startTime(), session.endTime());

        List<CandidatePlace> unseenCandidates = openCandidates.stream()
                .filter(c -> !session.shownPlaceIds().contains(c.place().id()))
                .toList();
        List<CandidatePlace> candidatePool = unseenCandidates.size() >= targetCount ? unseenCandidates : openCandidates;

        List<String> orderedIds = selectOrderedIds(candidatePool, session.purpose(), targetCount, true);
        List<PlaceCandidate> places = buildPlaces(candidatePool, orderedIds, targetCount, region, session.startTime(), session.endTime());

        Set<String> updatedShownPlaceIds = new LinkedHashSet<>(session.shownPlaceIds());
        places.forEach(p -> updatedShownPlaceIds.add(p.placeId()));
        int updatedRetryCount = session.retryCount() + 1;
        sessionStore.update(requestId, new CourseRequestSession(
                session.districtId(), session.purpose(), session.startTime(), session.endTime(),
                updatedShownPlaceIds, updatedRetryCount));

        return new CourseCandidateResponse(places, requestId, sessionStore.retryLimit() - updatedRetryCount);
    }

    private List<CandidatePlace> openCandidates(Region region, LocalTime startTime, LocalTime endTime) {
        List<CandidatePlace> rawCandidates = fetchCandidates(region);
        if (rawCandidates.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_PLACES_FOUND,
                    "선택한 지역에서 조건에 맞는 장소를 찾지 못했어요. 지역을 다시 선택해주세요.");
        }

        List<CandidatePlace> openCandidates = rawCandidates.stream()
                .filter(c -> !isClosedDuring(c.place().regularOpeningHours(), startTime, endTime))
                .toList();
        if (openCandidates.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_PLACES_FOUND,
                    "선택한 시간대에 운영 중인 장소가 없어요. 시간대를 다시 설정해주세요.");
        }
        return openCandidates;
    }

    private List<PlaceCandidate> buildPlaces(List<CandidatePlace> candidatePool, List<String> orderedIds, int targetCount,
                                              Region region, LocalTime startTime, LocalTime endTime) {
        if (orderedIds.isEmpty()) {
            throw new BusinessException(ErrorCode.NO_PLACES_FOUND,
                    "선택한 목적에 맞는 장소를 찾지 못했어요. 목적을 다시 선택해주세요.");
        }

        Map<String, CandidatePlace> candidatesById = candidatePool.stream()
                .collect(Collectors.toMap(c -> c.place().id(), c -> c, (a, b) -> a));

        List<PlaceCandidate> places = orderedIds.stream()
                .map(candidatesById::get)
                .filter(Objects::nonNull) // LLM이 실제 후보 목록에 없는 placeId(할루시네이션)를 준 경우 여기서 제외됨
                .limit(targetCount) // LLM이 목표 개수보다 많이 반환한 경우를 방어
                .map(c -> toPlaceCandidate(c, region, startTime, endTime))
                .toList();

        if (places.isEmpty()) {
            // orderedIds 자체는 비어있지 않았지만(LLM은 응답함) 전부 실제 후보에 없는 id였던 경우
            throw new BusinessException(ErrorCode.NO_PLACES_FOUND,
                    "선택한 목적에 맞는 장소를 찾지 못했어요. 목적을 다시 선택해주세요.");
        }

        return avoidConsecutiveCategories(places);
    }

    // LLM이 "동일 카테고리 연속 금지" 규칙을 지켰는지 신뢰하지 않고, 응답 조립 단계에서 결정적으로 재검증·보정한다
    private List<PlaceCandidate> avoidConsecutiveCategories(List<PlaceCandidate> places) {
        List<PlaceCandidate> result = new ArrayList<>(places);
        for (int i = 1; i < result.size(); i++) {
            if (!result.get(i).category().equals(result.get(i - 1).category())) {
                continue;
            }
            for (int j = i + 1; j < result.size(); j++) {
                if (!result.get(j).category().equals(result.get(i - 1).category())) {
                    PlaceCandidate swapped = result.get(i);
                    result.set(i, result.get(j));
                    result.set(j, swapped);
                    break;
                }
            }
        }
        return result;
    }

    private List<CandidatePlace> fetchCandidates(Region region) {
        List<CandidatePlace> candidates = new ArrayList<>();
        Set<String> seenPlaceIds = new HashSet<>();

        for (PlaceCategory category : PlaceCategory.values()) {
            String query = "%s %s %s".formatted(region.getCategory(), region.getName(), category.searchKeyword());
            for (PlaceSearchResponse.Place place : googlePlacesClient.searchText(query)) {
                if (seenPlaceIds.add(place.id())) {
                    candidates.add(new CandidatePlace(place, category));
                }
            }
        }
        return candidates;
    }

    private List<String> selectOrderedIds(List<CandidatePlace> openCandidates, Purpose purpose, int targetCount, boolean bypassCache) {
        List<PlaceCandidateDraft> drafts = openCandidates.stream()
                .map(c -> new PlaceCandidateDraft(
                        c.place().id(),
                        displayName(c.place()),
                        c.category(),
                        c.place().rating(),
                        c.place().userRatingCount(),
                        c.place().editorialSummary() == null ? null : c.place().editorialSummary().text()
                ))
                .toList();

        try {
            return coursePlaceSelector.select(drafts, purpose, targetCount, bypassCache);
        } catch (BusinessException e) {
            throw e; // 일일 호출 한도 초과 등 이미 의미가 있는 예외는 그대로 전파
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.AI_CALL_FAILED);
        }
    }

    private PlaceCandidate toPlaceCandidate(CandidatePlace candidate, Region region, LocalTime startTime, LocalTime endTime) {
        PlaceSearchResponse.Place place = candidate.place();
        PlaceSearchResponse.Location location = place.location();

        return new PlaceCandidate(
                place.id(),
                displayName(place),
                candidate.category().label(),
                region.getCategory(),
                place.formattedAddress(),
                place.rating(),
                place.userRatingCount(),
                formatBusinessHours(place.regularOpeningHours(), startTime, endTime),
                location == null ? null : location.latitude(),
                location == null ? null : location.longitude(),
                photoUrl(place)
        );
    }

    private String displayName(PlaceSearchResponse.Place place) {
        return place.displayName() == null ? "" : place.displayName().text();
    }

    // API 키가 담긴 Google 원본 URL 대신, 백엔드 프록시 엔드포인트(/api/places/photo) URL을 내려준다
    private String photoUrl(PlaceSearchResponse.Place place) {
        if (place.photos() == null || place.photos().isEmpty()) {
            return null;
        }
        String photoName = place.photos().get(0).name();
        return "/api/places/photo?name=" + URLEncoder.encode(photoName, StandardCharsets.UTF_8);
    }

    private int resolveTargetCount(LocalTime startTime, LocalTime endTime) {
        long activityHours = Duration.between(startTime, endTime).toMinutes() / 60;
        if (activityHours <= 3) {
            return 2;
        }
        if (activityHours <= 5) {
            return 3;
        }
        if (activityHours <= 8) {
            return 4;
        }
        return 5;
    }

    // 영업시간 정보가 없으면 배제하지 않고, 명시된 시간대가 요청 구간을 커버하지 못할 때만 배제
    private boolean isClosedDuring(PlaceSearchResponse.OpeningHours hours, LocalTime startTime, LocalTime endTime) {
        if (hours == null || hours.periods() == null || hours.periods().isEmpty()) {
            return false;
        }
        return hours.periods().stream().noneMatch(period -> covers(period, startTime, endTime));
    }

    private String formatBusinessHours(PlaceSearchResponse.OpeningHours hours, LocalTime startTime, LocalTime endTime) {
        if (hours == null || hours.periods() == null) {
            return null;
        }
        return hours.periods().stream()
                .filter(period -> covers(period, startTime, endTime))
                .findFirst()
                .map(this::formatPeriod)
                .orElse(null);
    }

    // 코스는 여러 장소를 구간 내 서로 다른 시점에 방문하므로, 장소 영업시간이 요청 구간을 통째로 포함할 필요는 없고 겹치기만 하면 된다
    private boolean covers(PlaceSearchResponse.Period period, LocalTime startTime, LocalTime endTime) {
        if (period.open() == null || period.close() == null) {
            return false;
        }
        LocalTime openTime = LocalTime.of(period.open().hour(), period.open().minute());
        LocalTime closeTime = LocalTime.of(period.close().hour(), period.close().minute());

        boolean overnight = closeTime.equals(LocalTime.MIDNIGHT) || closeTime.isBefore(openTime);
        if (overnight) {
            return openTime.isBefore(endTime);
        }
        return openTime.isBefore(endTime) && closeTime.isAfter(startTime);
    }

    private String formatPeriod(PlaceSearchResponse.Period period) {
        return "%02d:%02d~%02d:%02d".formatted(
                period.open().hour(), period.open().minute(),
                period.close().hour(), period.close().minute());
    }
}
