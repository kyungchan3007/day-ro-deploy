package com.dayro.global.quota;

import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
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
            throw new BusinessException(ErrorCode.DAILY_API_QUOTA_EXCEEDED);
        }
    }
}
