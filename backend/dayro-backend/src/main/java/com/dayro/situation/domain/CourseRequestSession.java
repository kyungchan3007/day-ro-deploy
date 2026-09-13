package com.dayro.situation.domain;

import java.time.LocalTime;
import java.util.Set;

// "다른 코스 보기" 재요청을 식별하기 위해 Redis(courseRequest:{requestId})에 저장하는 세션 - 로그인 없이도 코스 생성이 가능해 별도 식별 수단이 필요함
public record CourseRequestSession(
        String districtId,
        Purpose purpose,
        LocalTime startTime,
        LocalTime endTime,
        Set<String> shownPlaceIds,
        int retryCount
) {
}
