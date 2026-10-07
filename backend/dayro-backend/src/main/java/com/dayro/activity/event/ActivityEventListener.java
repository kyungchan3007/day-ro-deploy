package com.dayro.activity.event;

import com.dayro.activity.domain.ActivityEvent;
import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.repository.ActivityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;

import static com.dayro.global.config.AsyncConfig.ACTIVITY_EVENT_EXECUTOR;

// 활동 이벤트를 비동기로 저장한다.
// - 트랜잭션 안에서 발행되면 커밋 이후에만 기록된다(롤백된 가입/저장이 통계에 남지 않게). 트랜잭션 밖이면 바로 기록(fallbackExecution).
// - 기록 실패는 경고 로그만 남기고 삼킨다 - 집계 때문에 본 기능이 실패하면 안 된다.
@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityEventListener {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String ACTIVE_KEY_PREFIX = "activity:active:";
    // 자정(KST) 경계 근처 요청도 키가 살아있도록 하루보다 조금 길게 잡는다 - 키에 날짜가 들어가 있어 다음 날과 섞이지 않는다
    private static final Duration ACTIVE_KEY_TTL = Duration.ofHours(26);

    private final ActivityEventRepository activityEventRepository;
    private final StringRedisTemplate redisTemplate;

    @Async(ACTIVITY_EVENT_EXECUTOR)
    @TransactionalEventListener(fallbackExecution = true)
    public void handle(ActivityOccurredEvent event) {
        try {
            if (event.type() != ActivityEventType.ACTIVE) {
                activityEventRepository.save(toEntity(event));
            }
            if (event.memberId() != null && event.type().countsAsActive()) {
                recordDailyActive(event);
            }
        } catch (Exception e) {
            log.warn("활동 이벤트 기록 실패 - type: {}, requestId: {}", event.type(), event.requestId(), e);
        }
    }

    // ACTIVE는 회원당 하루 1건만 남긴다 - Redis SET NX로 오늘 이미 남겼는지 확인
    private void recordDailyActive(ActivityOccurredEvent event) {
        LocalDate today = LocalDate.ofInstant(event.occurredAt(), KST);
        String key = ACTIVE_KEY_PREFIX + today + ":" + event.memberId();
        Boolean firstToday = redisTemplate.opsForValue().setIfAbsent(key, "1", ACTIVE_KEY_TTL);
        if (Boolean.TRUE.equals(firstToday)) {
            activityEventRepository.save(ActivityEvent.builder()
                    .eventType(ActivityEventType.ACTIVE)
                    .memberId(event.memberId())
                    .metadata(Map.of("trigger", event.type().name()))
                    .occurredAt(event.occurredAt())
                    .build());
        }
    }

    private ActivityEvent toEntity(ActivityOccurredEvent event) {
        return ActivityEvent.builder()
                .eventType(event.type())
                .memberId(event.memberId())
                .requestId(event.requestId())
                .metadata(event.metadata())
                .occurredAt(event.occurredAt())
                .build();
    }
}
