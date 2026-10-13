package com.dayro.course.controller;

import com.dayro.course.dto.request.CourseSaveRequest;
import com.dayro.course.dto.request.CourseUpdateRequest;
import com.dayro.course.dto.response.CourseResponse;
import com.dayro.course.dto.response.CourseSummaryResponse;
import com.dayro.course.service.CourseService;
import com.dayro.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    public ResponseEntity<ApiResponse<CourseResponse>> save(@AuthenticationPrincipal String memberId,
                                                              @Valid @RequestBody CourseSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success(courseService.save(UUID.fromString(memberId), request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseSummaryResponse>>> findMyCourses(@AuthenticationPrincipal String memberId) {
        return ResponseEntity.ok(ApiResponse.success(courseService.findMyCourses(UUID.fromString(memberId))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> findMyCourseDetail(@AuthenticationPrincipal String memberId,
                                                                           @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(courseService.findMyCourseDetail(UUID.fromString(memberId), id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> update(@AuthenticationPrincipal String memberId,
                                                                @PathVariable UUID id,
                                                                @Valid @RequestBody CourseUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(courseService.update(UUID.fromString(memberId), id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal String memberId,
                                                       @PathVariable UUID id) {
        courseService.delete(UUID.fromString(memberId), id);
        return ResponseEntity.ok(ApiResponse.success("코스가 삭제되었습니다."));
    }
}
