package com.dayro.global.quota;

import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

// 호출자 단위 고정 윈도우 레이트 리밋.
// DailyCallBudget이 "하루 총액"을 막는다면 이쪽은 "한 명이 그 총액을 혼자 순식간에 태우는 것"을 막는다.
// 비로그인으로 열려 있으면서 호출당 과금되는 엔드포인트(/api/places/photo)에 필수
@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimiter {

    private final StringRedisTemplate redisTemplate;

    public void check(String name, String clientKey, long limit, Duration window) {
        long windowIndex = System.currentTimeMillis() / window.toMillis();
        String key = "rate:%s:%s:%d".formatted(name, clientKey, windowIndex);

        Long count = redisTemplate.opsForValue().increment(key);
        if (count == null) {
            return;
        }
        if (count == 1L) {
            // 윈도우가 넘어간 뒤에도 키가 남아 다음 윈도우를 오염시키지 않도록 윈도우 길이만큼만 유지
            redisTemplate.expire(key, window);
        }
        if (count > limit) {
            log.warn("레이트 리밋 초과 - name: {}, client: {}, limit: {}, count: {}", name, clientKey, limit, count);
            throw new BusinessException(ErrorCode.TOO_MANY_REQUESTS);
        }
    }
}
