package com.dayro.course.dto.response;

import com.dayro.situation.domain.Purpose;

import java.time.LocalDateTime;
import java.util.UUID;

// 내 저장 코스 목록 카드용 - 상세 place 리스트 대신 개수/썸네일만 내려준다
public record CourseSummaryResponse(
        UUID id,
        String title,
        String description,
        String regionName,
        Purpose purpose,
        LocalDateTime createdAt,
        int placeCount,
        String thumbnailUrl
) {
}
