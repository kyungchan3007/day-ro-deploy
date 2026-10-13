package com.dayro.course.service;

import com.dayro.course.dto.request.CourseSaveRequest;
import com.dayro.course.dto.request.CourseUpdateRequest;
import com.dayro.course.dto.response.CourseResponse;
import com.dayro.course.dto.response.CourseSummaryResponse;

import java.util.List;
import java.util.UUID;

public interface CourseService {

    CourseResponse save(UUID memberId, CourseSaveRequest request);

    List<CourseSummaryResponse> findMyCourses(UUID memberId);

    CourseResponse findMyCourseDetail(UUID memberId, UUID courseId);

    CourseResponse update(UUID memberId, UUID courseId, CourseUpdateRequest request);

    void delete(UUID memberId, UUID courseId);
}
