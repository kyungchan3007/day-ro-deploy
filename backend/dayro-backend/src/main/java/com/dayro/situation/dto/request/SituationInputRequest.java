package com.dayro.situation.dto.request;

import com.dayro.situation.domain.Purpose;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Duration;
import java.time.LocalTime;

// AI 코스생성 도메인으로 전달되는 상황입력 요청 계약 (기획안 슬라이드5/15 검증 규칙 반영)
public record SituationInputRequest(
        @NotNull LocalTime startTime,
        @NotNull @Schema(example = "18:30:00") LocalTime endTime,
        @NotBlank String districtId,
        @NotNull Purpose purpose
) {
    @AssertTrue(message = "데이트 시간은 종료 시간이 시작 시간보다 늦어야 하며, 최소 2시간에서 최대 12시간까지 선택할 수 있습니다.")
    public boolean isDurationValid() {
        if (startTime == null || endTime == null) {
            return true;
        }
        long minutes = Duration.between(startTime, endTime).toMinutes();
        return minutes >= 120 && minutes <= 720;
    }
}
