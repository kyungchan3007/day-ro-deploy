package com.dayro.course.dto.response;

import com.dayro.situation.domain.Purpose;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

// 코스 저장/상세조회 공용 응답
public record CourseResponse(
        UUID id,
        String title,
        String description,
        String regionName,
        String regionCategory,
        Purpose purpose,
        LocalTime startTime,
        LocalTime endTime,
        List<PlaceItem> places,
        LocalDateTime createdAt
) {
    public record PlaceItem(
            String placeId,
            String name,
            String category,
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
