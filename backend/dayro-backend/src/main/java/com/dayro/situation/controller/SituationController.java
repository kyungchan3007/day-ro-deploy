package com.dayro.situation.controller;

import com.dayro.global.response.ApiResponse;
import com.dayro.situation.dto.request.SituationInputRequest;
import com.dayro.situation.dto.response.CourseCandidateResponse;
import com.dayro.situation.service.CourseRecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/situations")
@RequiredArgsConstructor
public class SituationController {

    private final CourseRecommendationService courseRecommendationService;

    @PostMapping
    public ResponseEntity<ApiResponse<CourseCandidateResponse>> submit(@Valid @RequestBody SituationInputRequest request) {
        return ResponseEntity.ok(ApiResponse.success(courseRecommendationService.recommend(request)));
    }
}
