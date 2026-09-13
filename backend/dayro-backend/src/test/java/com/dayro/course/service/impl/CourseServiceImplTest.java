package com.dayro.course.service.impl;

import com.dayro.auth.domain.Member;
import com.dayro.auth.repository.MemberRepository;
import com.dayro.course.domain.Course;
import com.dayro.course.domain.CoursePlace;
import com.dayro.course.dto.request.CourseSaveRequest;
import com.dayro.course.dto.request.CourseUpdateRequest;
import com.dayro.course.dto.response.CourseResponse;
import com.dayro.course.dto.response.CourseSummaryResponse;
import com.dayro.course.repository.CourseRepository;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.situation.domain.Purpose;
import com.dayro.situation.domain.Region;
import com.dayro.situation.repository.RegionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    CourseRepository courseRepository;
    @Mock
    MemberRepository memberRepository;
    @Mock
    RegionRepository regionRepository;

    @InjectMocks
    CourseServiceImpl courseService;

    private CourseSaveRequest.PlaceItem placeItem(String placeId) {
        return new CourseSaveRequest.PlaceItem(
                placeId, "스타벅스 홍대점", "카페", "서울 마포구 양화로",
                4.5, 120, "10:00~22:00", 37.5, 126.9, "/api/places/photo?name=places%2F" + placeId + "%2Fphotos%2F1");
    }

    private Course courseWithPlaces(Member member, LocalTime startTime, LocalTime endTime, String... placeIds) {
        Course course = Course.builder()
                .member(member).title("기존 제목").description("기존 설명")
                .regionName("홍대").regionCategory("마포구")
                .purpose(Purpose.FRIENDS).startTime(startTime).endTime(endTime)
                .build();
        for (int i = 0; i < placeIds.length; i++) {
            course.addPlace(CoursePlace.builder().visitOrder(i).placeId(placeIds[i]).name("장소" + i).build());
        }
        return course;
    }

    @Test
    void save_success() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        Region region = Region.builder()
                .districtId("district-1").category("마포구").categoryOrder(1)
                .name("홍대").dong("서교동").sortOrder(1)
                .build();
        CourseSaveRequest request = new CourseSaveRequest(
                "홍대 데이트 코스", "분위기 좋은 연남동 코스", "district-1", Purpose.ANNIVERSARY,
                LocalTime.of(18, 0), LocalTime.of(21, 0),
                List.of(placeItem("place-1"), placeItem("place-2")));

        given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
        given(regionRepository.findByDistrictId("district-1")).willReturn(Optional.of(region));
        given(courseRepository.save(any(Course.class))).willAnswer(invocation -> invocation.getArgument(0));

        CourseResponse response = courseService.save(memberId, request);

        assertThat(response.title()).isEqualTo("홍대 데이트 코스");
        assertThat(response.description()).isEqualTo("분위기 좋은 연남동 코스");
        assertThat(response.regionName()).isEqualTo("홍대");
        assertThat(response.regionCategory()).isEqualTo("마포구");
        assertThat(response.places()).hasSize(2);
        assertThat(response.places().get(0).placeId()).isEqualTo("place-1");
        assertThat(response.places().get(1).placeId()).isEqualTo("place-2");

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(captor.capture());
        assertThat(captor.getValue().getCoursePlaces()).extracting(cp -> cp.getVisitOrder())
                .containsExactly(0, 1);
    }

    @Test
    void save_regionNotFound() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        CourseSaveRequest request = new CourseSaveRequest(
                "코스", null, "invalid-district", Purpose.CASUAL_DATE,
                LocalTime.of(18, 0), LocalTime.of(21, 0),
                List.of(placeItem("place-1")));

        given(memberRepository.findById(memberId)).willReturn(Optional.of(member));
        given(regionRepository.findByDistrictId("invalid-district")).willReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.save(memberId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REGION_NOT_FOUND);
    }

    @Test
    void findMyCourseDetail_notOwnedOrMissing_throws() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.findMyCourseDetail(memberId, courseId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void update_success() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        Course course = courseWithPlaces(member, LocalTime.of(18, 0), LocalTime.of(21, 0), "place-1", "place-2");
        CourseUpdateRequest request = new CourseUpdateRequest("새 제목", "새 설명", List.of("place-1", "place-2"));

        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.of(course));

        CourseResponse response = courseService.update(memberId, courseId, request);

        assertThat(response.title()).isEqualTo("새 제목");
        assertThat(response.description()).isEqualTo("새 설명");
    }

    @Test
    void update_notOwnedOrMissing_throws() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        CourseUpdateRequest request = new CourseUpdateRequest("새 제목", "새 설명", List.of("place-1"));

        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.update(memberId, courseId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void update_reordersAndDeletesPlaces() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        // 3시간 코스(최소 2곳) - 3곳 중 1곳을 삭제하고 남은 2곳의 순서를 바꿔도 최소 개수를 충족한다
        Course course = courseWithPlaces(member, LocalTime.of(18, 0), LocalTime.of(21, 0), "place-1", "place-2", "place-3");
        CourseUpdateRequest request = new CourseUpdateRequest("새 제목", "새 설명", List.of("place-2", "place-1"));

        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.of(course));

        CourseResponse response = courseService.update(memberId, courseId, request);

        assertThat(response.places()).extracting(CourseResponse.PlaceItem::placeId)
                .containsExactly("place-2", "place-1");
    }

    @Test
    void update_belowMinimumPlaceCount_throws() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        // 3시간 코스는 최소 2곳이 필요한데 1곳만 남기려는 요청
        Course course = courseWithPlaces(member, LocalTime.of(18, 0), LocalTime.of(21, 0), "place-1", "place-2");
        CourseUpdateRequest request = new CourseUpdateRequest("새 제목", "새 설명", List.of("place-1"));

        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.update(memberId, courseId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_PLACE_MINIMUM_NOT_MET);
    }

    @Test
    void update_unknownPlaceId_throws() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        Course course = courseWithPlaces(member, LocalTime.of(18, 0), LocalTime.of(21, 0), "place-1", "place-2");
        CourseUpdateRequest request = new CourseUpdateRequest("새 제목", "새 설명", List.of("place-1", "place-unknown"));

        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.update(memberId, courseId, request))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void delete_success() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        Course course = courseWithPlaces(member, LocalTime.of(18, 0), LocalTime.of(21, 0), "place-1");

        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.of(course));

        courseService.delete(memberId, courseId);

        verify(courseRepository).delete(course);
    }

    @Test
    void delete_notOwnedOrMissing_throws() {
        UUID memberId = UUID.randomUUID();
        UUID courseId = UUID.randomUUID();
        given(courseRepository.findByIdAndMember_Id(courseId, memberId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.delete(memberId, courseId))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void findMyCourses_mapsThumbnailFromFirstPlace() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder().kakaoId("1").nickname("테스트").build();
        Region region = Region.builder()
                .districtId("district-1").category("마포구").categoryOrder(1)
                .name("홍대").dong("서교동").sortOrder(1)
                .build();
        Course course = Course.builder()
                .member(member).title("코스").regionName(region.getName()).regionCategory(region.getCategory())
                .purpose(Purpose.FRIENDS).startTime(LocalTime.of(18, 0)).endTime(LocalTime.of(21, 0))
                .build();
        course.addPlace(com.dayro.course.domain.CoursePlace.builder()
                .visitOrder(0).placeId("place-1").name("장소1").photoUrl("photo-url-1")
                .build());

        given(courseRepository.findAllByMember_IdOrderByCreatedAtDesc(memberId)).willReturn(List.of(course));

        List<CourseSummaryResponse> result = courseService.findMyCourses(memberId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).placeCount()).isEqualTo(1);
        assertThat(result.get(0).thumbnailUrl()).isEqualTo("photo-url-1");
    }
}
