package com.dayro.situation.dto.response;

import java.util.List;

// AI 기반 장소 추천 응답 - 사용자가 이 리스트 중 직접 최소 개수 이상을 골라 방문 순서를 정하는 방식(기획안 26.07.14 Updated v0.6 확정)
// requestId/remainingRetries는 "다른 코스 보기"(POST /api/situations/{requestId}/retry) 재요청 식별용
public record CourseCandidateResponse(List<PlaceCandidate> places, String requestId, int remainingRetries) {

    public record PlaceCandidate(
            String placeId,
            String name,
            String category,
            String district,
            String address,
            Double rating,
            Integer userRatingCount,
            String businessHours,
            Double latitude,
            Double longitude,
            String photoUrl
    ) {
    }
}
