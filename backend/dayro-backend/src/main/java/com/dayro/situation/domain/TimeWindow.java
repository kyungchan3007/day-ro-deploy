package com.dayro.situation.domain;

import java.time.Duration;
import java.time.LocalTime;

// 데이트 시간대 - 종료가 시작보다 이르거나 같으면 자정을 넘긴 것(익일 종료)으로 본다. FE situation/model/time.ts의 durationMinutes와 같은 규칙
public record TimeWindow(LocalTime start, LocalTime end) {

    private static final int MINUTES_PER_DAY = 24 * 60;

    public boolean isOvernight() {
        return !end.isAfter(start);
    }

    public long minutes() {
        long minutes = Duration.between(start, end).toMinutes();
        return isOvernight() ? minutes + MINUTES_PER_DAY : minutes;
    }

    // 시작일 자정 기준 분 - 익일 종료면 1440 이상이 된다
    public int startMinute() {
        return start.getHour() * 60 + start.getMinute();
    }

    public int endMinute() {
        return startMinute() + (int) minutes();
    }
}
