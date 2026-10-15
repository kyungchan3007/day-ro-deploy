package com.dayro.course.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

// 저장된 코스 수정 요청 - 제목/한 줄 설명 변경, 장소 순서 변경·삭제까지 지원(장소 추가는 미지원, 재저장(POST) 흐름으로 처리)
// placeIds는 남길 장소를 새 방문 순서대로 나열한 것 - 기존 목록에서 빠진 placeId는 삭제로 처리한다
public record CourseUpdateRequest(
        @NotBlank @Size(max = 15) String title,
        @Size(max = 20) String description,
        @NotEmpty List<@NotBlank String> placeIds
) {
}
