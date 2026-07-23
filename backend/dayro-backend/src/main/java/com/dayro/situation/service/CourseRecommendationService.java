package com.dayro.situation.service;

import com.dayro.situation.dto.request.SituationInputRequest;
import com.dayro.situation.dto.response.CourseCandidateResponse;

public interface CourseRecommendationService {

    CourseCandidateResponse recommend(SituationInputRequest request);
}
