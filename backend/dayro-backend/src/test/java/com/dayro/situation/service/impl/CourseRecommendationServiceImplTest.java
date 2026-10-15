package com.dayro.situation.service.impl;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.anyInt;
import org.springframework.context.ApplicationEventPublisher;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.situation.client.GooglePlacesClient;
import com.dayro.situation.domain.CourseRequestSession;
import com.dayro.situation.domain.Purpose;
import com.dayro.situation.domain.Region;
import com.dayro.situation.dto.external.PlaceSearchResponse;
import com.dayro.situation.dto.request.SituationInputRequest;
import com.dayro.situation.dto.response.CourseCandidateResponse;
import com.dayro.situation.repository.RegionRepository;
import com.dayro.situation.service.CourseRequestSessionStore;
import com.dayro.situation.service.ai.CoursePlaceSelector;
import com.dayro.situation.service.ai.PlaceCandidateDraft;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CourseRecommendationServiceImplTest {

    @Mock
    RegionRepository regionRepository;
    @Mock
    GooglePlacesClient googlePlacesClient;
    @Mock
    CoursePlaceSelector coursePlaceSelector;
    @Mock
    CourseRequestSessionStore sessionStore;
    @Mock
    ApplicationEventPublisher eventPublisher;

    @InjectMocks
    CourseRecommendationServiceImpl courseRecommendationService;

    private static final LocalTime START = LocalTime.of(18, 0);
    private static final LocalTime END = LocalTime.of(21, 0); // 3시간 -> targetCount 2

    private Region region() {
        return Region.builder().districtId("d1").category("마포구").categoryOrder(0)
                .name("홍대").dong("서교동").sortOrder(0).build();
    }

    private PlaceSearchResponse.Place place(String id) {
        PlaceSearchResponse.TimePoint open = new PlaceSearchResponse.TimePoint(0, 0, 0);
        PlaceSearchResponse.TimePoint close = new PlaceSearchResponse.TimePoint(0, 23, 59);
        PlaceSearchResponse.OpeningHours hours = new PlaceSearchResponse.OpeningHours(
                List.of(new PlaceSearchResponse.Period(open, close)), null);
        return new PlaceSearchResponse.Place(
                id, new PlaceSearchResponse.DisplayName(id, "ko"), List.of(), "서울 마포구",
                new PlaceSearchResponse.Location(37.0, 127.0), 4.5, 100, hours, null, null);
    }

    private PlaceSearchResponse.Place placeWithHours(String id, PlaceSearchResponse.Period... periods) {
        return new PlaceSearchResponse.Place(
                id, new PlaceSearchResponse.DisplayName(id, "ko"), List.of(), "서울 마포구",
                new PlaceSearchResponse.Location(37.0, 127.0), 4.5, 100,
                new PlaceSearchResponse.OpeningHours(List.of(periods), null), null, null);
    }

    private PlaceSearchResponse.Period period(int openHour, int openMinute, Integer closeHour, Integer closeMinute) {
        PlaceSearchResponse.TimePoint close = closeHour == null ? null
                : new PlaceSearchResponse.TimePoint(1, closeHour, closeMinute);
        return new PlaceSearchResponse.Period(new PlaceSearchResponse.TimePoint(1, openHour, openMinute), close);
    }

    private PlaceSearchResponse.Place placeAt(String id, String address) {
        PlaceSearchResponse.Place base = place(id);
        return new PlaceSearchResponse.Place(
                base.id(), base.displayName(), base.types(), address, base.location(), base.rating(),
                base.userRatingCount(), base.regularOpeningHours(), base.editorialSummary(), base.photos());
    }

    private List<CoursePlaceSelector.SelectedPlace> selected(String... placeIds) {
        return Arrays.stream(placeIds).map(id -> new CoursePlaceSelector.SelectedPlace(id, null)).toList();
    }

    private PlaceSearchResponse.Place named(String id, String name) {
        PlaceSearchResponse.Place base = place(id);
        return new PlaceSearchResponse.Place(
                base.id(), new PlaceSearchResponse.DisplayName(name, "ko"), base.types(), base.formattedAddress(), base.location(),
                base.rating(), base.userRatingCount(), base.regularOpeningHours(), base.editorialSummary(), base.photos());
    }

    private SituationInputRequest request() {
        return new SituationInputRequest(START, END, "d1", Purpose.ANNIVERSARY);
    }

    @Test
    void recommend_success_issuesRequestIdAndRemainingRetries() {
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(place("p1"), place("p2"), place("p3")));
        given(coursePlaceSelector.select(anyList(), eq(Purpose.ANNIVERSARY), eq(2), eq(false)))
                .willReturn(selected("p1", "p2"));
        given(sessionStore.create(any(), any())).willReturn("req-1");
        given(sessionStore.retryLimit()).willReturn(5);

        CourseCandidateResponse response = courseRecommendationService.recommend(request());

        assertThat(response.requestId()).isEqualTo("req-1");
        assertThat(response.remainingRetries()).isEqualTo(5);
        assertThat(response.places()).extracting("placeId").containsExactly("p1", "p2");
        verify(sessionStore).create(any(), eq(List.of("p1", "p2")));

        // 토큰 없이 들어온 요청 - 비회원 생성으로 남는다
        ArgumentCaptor<ActivityOccurredEvent> eventCaptor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        ActivityOccurredEvent event = eventCaptor.getValue();
        assertThat(event.type()).isEqualTo(ActivityEventType.COURSE_GENERATE);
        assertThat(event.memberId()).isNull();
        assertThat(event.requestId()).isEqualTo("req-1");
        assertThat(event.metadata())
                .containsEntry("regionName", "홍대")
                .containsEntry("purpose", "ANNIVERSARY")
                .containsEntry("durationMinutes", 180L)
                .containsEntry("resultCount", 2);
    }

    @Test
    void recommend_withValidToken_recordsMemberId() {
        UUID memberId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(memberId.toString(), null, List.of()));
        try {
            given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
            given(googlePlacesClient.searchText(any())).willReturn(List.of(place("p1"), place("p2")));
            given(coursePlaceSelector.select(anyList(), any(), anyInt(), eq(false))).willReturn(selected("p1", "p2"));
            given(sessionStore.create(any(), any())).willReturn("req-1");

            courseRecommendationService.recommend(request());

            ArgumentCaptor<ActivityOccurredEvent> eventCaptor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
            verify(eventPublisher).publishEvent(eventCaptor.capture());
            assertThat(eventCaptor.getValue().memberId()).isEqualTo(memberId);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    @Test
    void recommend_failure_recordsFailureReasonAndRethrows() {
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of());

        assertThatThrownBy(() -> courseRecommendationService.recommend(request()))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NO_PLACES_FOUND);

        ArgumentCaptor<ActivityOccurredEvent> eventCaptor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        ActivityOccurredEvent event = eventCaptor.getValue();
        assertThat(event.type()).isEqualTo(ActivityEventType.COURSE_GENERATE_FAIL);
        assertThat(event.metadata())
                .containsEntry("retry", false)
                .containsEntry("errorCode", "NO_PLACES_FOUND")
                .containsEntry("districtId", "d1");
    }

    @Test
    void retry_sessionNotFound_throwsCourseRequestNotFound() {
        given(sessionStore.get("missing")).willThrow(new BusinessException(ErrorCode.COURSE_REQUEST_NOT_FOUND));

        assertThatThrownBy(() -> courseRecommendationService.retry("missing"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COURSE_REQUEST_NOT_FOUND);
    }

    @Test
    void retry_retryLimitReached_throwsCourseRetryLimitExceeded() {
        CourseRequestSession session = new CourseRequestSession("d1", Purpose.ANNIVERSARY, START, END, Set.of("p1"), 5);
        given(sessionStore.get("req-1")).willReturn(session);
        given(sessionStore.retryLimit()).willReturn(5);

        assertThatThrownBy(() -> courseRecommendationService.retry("req-1"))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.COURSE_RETRY_LIMIT_EXCEEDED);
        verify(regionRepository, never()).findByDistrictId(any());

        ArgumentCaptor<ActivityOccurredEvent> eventCaptor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo(ActivityEventType.COURSE_GENERATE_FAIL);
        assertThat(eventCaptor.getValue().requestId()).isEqualTo("req-1");
        assertThat(eventCaptor.getValue().metadata()).containsEntry("errorCode", "COURSE_RETRY_LIMIT_EXCEEDED");
    }

    @Test
    void retry_bypassesCacheAndAccumulatesShownPlaceIds() {
        // 이미 보여준 곳(p1,p2)을 빼면 후보가 targetCount(2)보다 적어(p3 하나) 전체 후보 재사용으로 폴백된다
        CourseRequestSession session = new CourseRequestSession("d1", Purpose.ANNIVERSARY, START, END, Set.of("p1", "p2"), 0);
        given(sessionStore.get("req-1")).willReturn(session);
        given(sessionStore.retryLimit()).willReturn(5);
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(place("p1"), place("p2"), place("p3")));
        given(coursePlaceSelector.select(anyList(), eq(Purpose.ANNIVERSARY), eq(2), eq(true)))
                .willReturn(selected("p3", "p1"));

        CourseCandidateResponse response = courseRecommendationService.retry("req-1");

        assertThat(response.requestId()).isEqualTo("req-1");
        assertThat(response.remainingRetries()).isEqualTo(4);
        assertThat(response.places()).extracting("placeId").containsExactly("p3", "p1");

        ArgumentCaptor<CourseRequestSession> captor = ArgumentCaptor.forClass(CourseRequestSession.class);
        verify(sessionStore).update(eq("req-1"), captor.capture());
        CourseRequestSession updated = captor.getValue();
        assertThat(updated.retryCount()).isEqualTo(1);
        assertThat(updated.shownPlaceIds()).containsExactlyInAnyOrder("p1", "p2", "p3");

        ArgumentCaptor<ActivityOccurredEvent> eventCaptor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().type()).isEqualTo(ActivityEventType.COURSE_RETRY);
        assertThat(eventCaptor.getValue().requestId()).isEqualTo("req-1");
        assertThat(eventCaptor.getValue().metadata()).containsEntry("retryCount", 1);
    }

    @SuppressWarnings("unchecked")
    @Test
    void recommend_overnightWindow_keepsPlacesOpenAcrossMidnight() {
        // QA #16 - 23:55 ~ 익일 03:55(4시간 -> targetCount 3)
        SituationInputRequest overnight = new SituationInputRequest(
                LocalTime.of(23, 55), LocalTime.of(3, 55), "d1", Purpose.FRIENDS);
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(
                placeWithHours("bar", period(18, 0, 2, 0)),        // 자정 넘겨 새벽 2시까지
                placeWithHours("lunch", period(11, 0, 22, 0)),     // 밤 10시 마감 - 제외
                placeWithHours("allday", period(0, 0, null, null)), // 24시간 영업(close 없음)
                placeWithHours("dawn", period(0, 30, 5, 0))));      // 익일 새벽에 영업
        given(coursePlaceSelector.select(anyList(), eq(Purpose.FRIENDS), eq(3), eq(false)))
                .willReturn(selected("bar", "allday", "dawn"));
        given(sessionStore.create(any(), any())).willReturn("req-1");

        CourseCandidateResponse response = courseRecommendationService.recommend(overnight);

        ArgumentCaptor<List<PlaceCandidateDraft>> draftsCaptor = ArgumentCaptor.forClass(List.class);
        verify(coursePlaceSelector).select(draftsCaptor.capture(), eq(Purpose.FRIENDS), eq(3), eq(false));
        assertThat(draftsCaptor.getValue()).extracting(PlaceCandidateDraft::placeId)
                .containsExactlyInAnyOrder("bar", "allday", "dawn");
        assertThat(response.places()).extracting("placeId").containsExactly("bar", "allday", "dawn");

        ArgumentCaptor<ActivityOccurredEvent> eventCaptor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().metadata()).containsEntry("durationMinutes", 240L);
    }

    @SuppressWarnings("unchecked")
    @Test
    void recommend_excludesPlacesOutsideSelectedDistrict() {
        // QA #20 - 강동구를 골랐는데 과천 국립현대미술관이 추천됨
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(
                placeAt("inside", "대한민국 서울특별시 마포구 와우산로 1"),
                placeAt("gwacheon", "대한민국 경기도 과천시 광명로 313"),
                placeAt("nextDistrict", "대한민국 서울특별시 서대문구 연세로 1"),
                placeAt("noAddress", null),
                placeAt("noDistrict", "대한민국 서울특별시 성내로3길 37"))); // Google이 구를 빼고 주는 경우 - 남긴다
        given(coursePlaceSelector.select(anyList(), any(), anyInt(), eq(false))).willReturn(selected("inside"));
        given(sessionStore.create(any(), any())).willReturn("req-1");

        CourseCandidateResponse response = courseRecommendationService.recommend(request());

        ArgumentCaptor<List<PlaceCandidateDraft>> draftsCaptor = ArgumentCaptor.forClass(List.class);
        verify(coursePlaceSelector).select(draftsCaptor.capture(), any(), anyInt(), eq(false));
        assertThat(draftsCaptor.getValue()).extracting(PlaceCandidateDraft::placeId)
                .containsExactly("inside", "noDistrict");
        assertThat(response.places()).extracting("placeId").containsExactly("inside");
    }

    @Test
    void recommend_allPlacesOutsideDistrict_throwsNoPlacesFound() {
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(placeAt("gwacheon", "대한민국 경기도 과천시 광명로 313")));

        assertThatThrownBy(() -> courseRecommendationService.recommend(request()))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NO_PLACES_FOUND);
        verify(coursePlaceSelector, never()).select(anyList(), any(), anyInt(), any(Boolean.class));
    }

    @Test
    void recommend_showsCleanedPlaceNames() {
        // QA #18 - 장소명에 검색용 키워드가 그대로 노출됨
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(
                named("ai", "을지다락 신사가로수길 레스토랑ㅣ신사역 맛집ㅣ가로수길 맛집ㅣrestaurants"),
                named("invented", "잠실새내역 맛집 랜돌프비어ㅣ송파 맥주"),
                named("plain", "블루보틀 성수"),
                named("noShortName", "카페 온화|연남동 카페")));
        given(coursePlaceSelector.select(anyList(), any(), anyInt(), eq(false))).willReturn(List.of(
                new CoursePlaceSelector.SelectedPlace("ai", "을지다락"),            // 원본에 있는 글자 - 그대로 사용
                new CoursePlaceSelector.SelectedPlace("invented", "랜돌프 비어 하우스"), // 원본에 없는 이름 - 구분자 앞부분으로 대체
                new CoursePlaceSelector.SelectedPlace("plain", "블루보틀 성수"),
                new CoursePlaceSelector.SelectedPlace("noShortName", null)));
        given(sessionStore.create(any(), any())).willReturn("req-1");

        CourseCandidateResponse response = courseRecommendationService.recommend(
                new SituationInputRequest(LocalTime.of(10, 0), LocalTime.of(17, 0), "d1", Purpose.ANNIVERSARY));

        assertThat(response.places()).extracting("name")
                .containsExactly("을지다락", "잠실새내역 맛집 랜돌프비어", "블루보틀 성수", "카페 온화");
    }
}
