package com.dayro.situation.service.impl;

import com.dayro.situation.dto.request.SituationInputRequest;
import com.dayro.situation.dto.response.CourseCandidateResponse;
import com.dayro.situation.service.CourseRecommendationService;
import org.springframework.stereotype.Service;

import java.util.List;

// AI 코스생성(한혜민 담당, feat/ai-course-generation) 연동 전 임시 스텁 - 요청 검증만 통과하면 고정 더미 장소를 반환
@Service
public class CourseRecommendationServiceImpl implements CourseRecommendationService {

    @Override
    public CourseCandidateResponse recommend(SituationInputRequest request) {
        return new CourseCandidateResponse(List.of(
                new CourseCandidateResponse.PlaceCandidate("stub-1", "경복궁", "고궁", "종로구"),
                new CourseCandidateResponse.PlaceCandidate("stub-2", "광장시장", "시장", "종로구"),
                new CourseCandidateResponse.PlaceCandidate("stub-3", "북촌한옥마을", "한옥마을", "종로구")
        ));
    }
}
