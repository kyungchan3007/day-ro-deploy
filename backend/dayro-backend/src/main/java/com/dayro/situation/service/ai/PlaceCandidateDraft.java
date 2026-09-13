package com.dayro.situation.service.ai;

import com.dayro.situation.domain.PlaceCategory;

// LLM 선별 단계에 넘기는 최소 정보 - 응답 DTO보다 판단에 필요한 정보(editorialSummary)를 더 담음
public record PlaceCandidateDraft(
        String placeId,
        String name,
        PlaceCategory category,
        Double rating,
        Integer userRatingCount,
        String editorialSummary
) {
}
