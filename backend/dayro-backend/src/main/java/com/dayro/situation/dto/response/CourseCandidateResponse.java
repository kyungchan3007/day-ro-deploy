package com.dayro.situation.dto.response;

import java.util.List;

// AI 코스생성(feat/ai-course-generation) 연동 전 임시 응답 계약 - 실제 추천 로직 붙기 전까지 스텁 데이터 반환
public record CourseCandidateResponse(List<PlaceCandidate> places) {

    public record PlaceCandidate(String placeId, String name, String category, String district) {
    }
}
