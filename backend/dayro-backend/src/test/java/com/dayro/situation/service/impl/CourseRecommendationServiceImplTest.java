package com.dayro.situation.service.impl;

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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
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

    private SituationInputRequest request() {
        return new SituationInputRequest(START, END, "d1", Purpose.ANNIVERSARY);
    }

    @Test
    void recommend_success_issuesRequestIdAndRemainingRetries() {
        given(regionRepository.findByDistrictId("d1")).willReturn(Optional.of(region()));
        given(googlePlacesClient.searchText(any())).willReturn(List.of(place("p1"), place("p2"), place("p3")));
        given(coursePlaceSelector.select(anyList(), eq(Purpose.ANNIVERSARY), eq(2), eq(false)))
                .willReturn(List.of("p1", "p2"));
        given(sessionStore.create(any(), any())).willReturn("req-1");
        given(sessionStore.retryLimit()).willReturn(5);

        CourseCandidateResponse response = courseRecommendationService.recommend(request());

        assertThat(response.requestId()).isEqualTo("req-1");
        assertThat(response.remainingRetries()).isEqualTo(5);
        assertThat(response.places()).extracting("placeId").containsExactly("p1", "p2");
        verify(sessionStore).create(any(), eq(List.of("p1", "p2")));
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
                .willReturn(List.of("p3", "p1"));

        CourseCandidateResponse response = courseRecommendationService.retry("req-1");

        assertThat(response.requestId()).isEqualTo("req-1");
        assertThat(response.remainingRetries()).isEqualTo(4);
        assertThat(response.places()).extracting("placeId").containsExactly("p3", "p1");

        ArgumentCaptor<CourseRequestSession> captor = ArgumentCaptor.forClass(CourseRequestSession.class);
        verify(sessionStore).update(eq("req-1"), captor.capture());
        CourseRequestSession updated = captor.getValue();
        assertThat(updated.retryCount()).isEqualTo(1);
        assertThat(updated.shownPlaceIds()).containsExactlyInAnyOrder("p1", "p2", "p3");
    }
}
