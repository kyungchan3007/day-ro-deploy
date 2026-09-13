package com.dayro.situation.service;

import com.dayro.global.error.BusinessException;
import com.dayro.global.error.ErrorCode;
import com.dayro.situation.domain.CourseRequestSession;
import com.dayro.situation.dto.request.SituationInputRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

// "다른 코스 보기" 세션(courseRequest:{requestId})의 Redis 입출력 - TTL은 최초 생성 시점에만 설정하고 재생성 시에는 갱신하지 않는다(24시간 리셋, 첫 생성 시점 기준)
@Component
@RequiredArgsConstructor
@Slf4j
public class CourseRequestSessionStore {

    private static final String KEY_PREFIX = "courseRequest:";
    private static final Duration SESSION_TTL = Duration.ofHours(24);

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${quota.course.retry-limit:5}")
    private int retryLimit;

    public int retryLimit() {
        return retryLimit;
    }

    public String create(SituationInputRequest request, List<String> shownPlaceIds) {
        String requestId = UUID.randomUUID().toString();
        CourseRequestSession session = new CourseRequestSession(
                request.districtId(), request.purpose(), request.startTime(), request.endTime(),
                Set.copyOf(shownPlaceIds), 0);
        redisTemplate.opsForValue().set(key(requestId), writeJson(session), SESSION_TTL);
        return requestId;
    }

    public CourseRequestSession get(String requestId) {
        String json = redisTemplate.opsForValue().get(key(requestId));
        if (json == null) {
            throw new BusinessException(ErrorCode.COURSE_REQUEST_NOT_FOUND);
        }
        return readJson(json);
    }

    public void update(String requestId, CourseRequestSession updated) {
        String key = key(requestId);
        Long remainingSeconds = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        if (remainingSeconds == null || remainingSeconds <= 0) {
            throw new BusinessException(ErrorCode.COURSE_REQUEST_NOT_FOUND);
        }
        redisTemplate.opsForValue().set(key, writeJson(updated), Duration.ofSeconds(remainingSeconds));
    }

    private String key(String requestId) {
        return KEY_PREFIX + requestId;
    }

    private String writeJson(CourseRequestSession session) {
        try {
            return objectMapper.writeValueAsString(session);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("코스 요청 세션 직렬화에 실패했습니다.", e);
        }
    }

    private CourseRequestSession readJson(String json) {
        try {
            return objectMapper.readValue(json, CourseRequestSession.class);
        } catch (JsonProcessingException e) {
            log.warn("코스 요청 세션 역직렬화 실패 - json: {}", json, e);
            throw new BusinessException(ErrorCode.COURSE_REQUEST_NOT_FOUND);
        }
    }
}
