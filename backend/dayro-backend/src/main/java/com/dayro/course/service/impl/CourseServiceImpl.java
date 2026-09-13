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
import com.dayro.course.service.CourseService;
import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.situation.domain.Region;
import com.dayro.situation.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final MemberRepository memberRepository;
    private final RegionRepository regionRepository;

    @Override
    @Transactional
    public CourseResponse save(UUID memberId, CourseSaveRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MEMBER_NOT_FOUND));
        Region region = regionRepository.findByDistrictId(request.districtId())
                .orElseThrow(() -> new BusinessException(ErrorCode.REGION_NOT_FOUND));

        Course course = Course.builder()
                .member(member)
                .title(request.title())
                .description(request.description())
                .regionName(region.getName())
                .regionCategory(region.getCategory())
                .purpose(request.purpose())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .build();

        List<CourseSaveRequest.PlaceItem> places = request.places();
        for (int i = 0; i < places.size(); i++) {
            course.addPlace(toCoursePlace(places.get(i), i));
        }

        return toResponse(courseRepository.save(course));
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseSummaryResponse> findMyCourses(UUID memberId) {
        return courseRepository.findAllByMember_IdOrderByCreatedAtDesc(memberId).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse findMyCourseDetail(UUID memberId, UUID courseId) {
        Course course = courseRepository.findByIdAndMember_Id(courseId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        return toResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse update(UUID memberId, UUID courseId, CourseUpdateRequest request) {
        Course course = courseRepository.findByIdAndMember_Id(courseId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));

        Set<String> existingPlaceIds = course.getCoursePlaces().stream()
                .map(CoursePlace::getPlaceId)
                .collect(Collectors.toSet());
        if (!existingPlaceIds.containsAll(request.placeIds())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT_VALUE);
        }
        if (request.placeIds().size() < minPlaceCount(course.getStartTime(), course.getEndTime())) {
            throw new BusinessException(ErrorCode.COURSE_PLACE_MINIMUM_NOT_MET);
        }

        course.update(request.title(), request.description());
        course.reorderPlaces(request.placeIds());

        return toResponse(course);
    }

    @Override
    @Transactional
    public void delete(UUID memberId, UUID courseId) {
        Course course = courseRepository.findByIdAndMember_Id(courseId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.COURSE_NOT_FOUND));
        courseRepository.delete(course);
    }

    // 코스 생성 시 활동시간대별 추천 최소개수(기획안 "3. 코스만들기 정책")와 동일한 기준 - 수정 시 그 미만으로 장소를 삭제할 수 없다
    private int minPlaceCount(LocalTime startTime, LocalTime endTime) {
        long activityHours = Duration.between(startTime, endTime).toMinutes() / 60;
        if (activityHours <= 5) {
            return 2;
        }
        if (activityHours <= 8) {
            return 3;
        }
        return 4;
    }

    private CoursePlace toCoursePlace(CourseSaveRequest.PlaceItem item, int visitOrder) {
        return CoursePlace.builder()
                .visitOrder(visitOrder)
                .placeId(item.placeId())
                .name(item.name())
                .category(item.category())
                .address(item.address())
                .rating(item.rating())
                .userRatingCount(item.userRatingCount())
                .businessHours(item.businessHours())
                .latitude(item.latitude())
                .longitude(item.longitude())
                .photoUrl(item.photoUrl())
                .build();
    }

    private CourseResponse toResponse(Course course) {
        List<CourseResponse.PlaceItem> places = course.getCoursePlaces().stream()
                .map(p -> new CourseResponse.PlaceItem(
                        p.getPlaceId(), p.getName(), p.getCategory(), p.getAddress(),
                        p.getRating(), p.getUserRatingCount(), p.getBusinessHours(),
                        p.getLatitude(), p.getLongitude(), p.getPhotoUrl()))
                .toList();

        return new CourseResponse(
                course.getId(), course.getTitle(), course.getDescription(), course.getRegionName(), course.getRegionCategory(),
                course.getPurpose(), course.getStartTime(), course.getEndTime(),
                places, course.getCreatedAt());
    }

    private CourseSummaryResponse toSummaryResponse(Course course) {
        String thumbnailUrl = course.getCoursePlaces().isEmpty() ? null : course.getCoursePlaces().get(0).getPhotoUrl();
        return new CourseSummaryResponse(
                course.getId(), course.getTitle(), course.getDescription(), course.getRegionName(), course.getPurpose(),
                course.getCreatedAt(), course.getCoursePlaces().size(), thumbnailUrl);
    }
}
