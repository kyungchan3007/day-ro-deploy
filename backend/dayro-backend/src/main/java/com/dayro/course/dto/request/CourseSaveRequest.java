package com.dayro.course.dto.request;

import com.dayro.situation.domain.Purpose;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.List;

// 코스 저장 요청 - 클라이언트가 /api/situations 응답에서 선택·정렬한 장소 정보를 그대로 담아 보낸다 (백엔드는 Google 재조회 없이 스냅샷 저장)
public record CourseSaveRequest(
        @NotBlank @Size(max = 15) String title,
        @Size(max = 20) String description,
        @NotBlank String districtId,
        @NotNull Purpose purpose,
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotEmpty List<@Valid PlaceItem> places
) {
    // 리스트 내 순서가 곧 방문 순서(visitOrder) - 별도 순서 값을 받지 않는다
    public record PlaceItem(
            @NotBlank String placeId,
            @NotBlank String name,
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
