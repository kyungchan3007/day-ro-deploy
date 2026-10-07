package com.dayro.global.quota;

import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import io.sentry.Sentry;
import io.sentry.SentryLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;

// 외부 유료 API(Google Places, Gemini) 호출량에 하루 단위 하드 캡을 걸어, 버그/폭주로 인한 과금 사고를 앱 레벨에서 차단
@Component
@RequiredArgsConstructor
@Slf4j
public class DailyCallBudget {

    private final StringRedisTemplate redisTemplate;

    public void consume(String name, long dailyLimit) {
        String key = "quota:%s:%s".formatted(name, LocalDate.now());
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, Duration.ofHours(26));
        }
        if (count != null && count > dailyLimit) {
            log.warn("일일 API 호출 한도 초과 - name: {}, limit: {}, count: {}", name, dailyLimit, count);
            if (count == dailyLimit + 1) {
                // 이 시점부터 그날은 사용자가 코스 생성을 못 한다 - 요청마다가 아니라 처음 넘긴 순간 한 번만 알린다
                Sentry.captureMessage("일일 API 호출 한도 초과 - " + name + " (limit " + dailyLimit + ")", SentryLevel.WARNING);
            }
            throw new BusinessException(ErrorCode.DAILY_API_QUOTA_EXCEEDED);
        }
    }
}
