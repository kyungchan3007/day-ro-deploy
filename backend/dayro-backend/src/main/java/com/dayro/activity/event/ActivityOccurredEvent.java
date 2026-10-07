package com.dayro.activity.event;

import com.dayro.activity.domain.ActivityEventType;

import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

// 도메인 서비스가 발행하는 활동 이벤트 - 저장은 ActivityEventListener가 비동기로 맡아, 집계 기록이 본 기능의 속도/성공 여부에 영향을 주지 않는다
// metadata 값은 문자열/숫자/불리언만 넣는다(LocalTime 등은 toString) - jsonb 직렬화를 Hibernate 기본 매퍼에 맡기기 위함
public record ActivityOccurredEvent(
        ActivityEventType type,
        UUID memberId,
        String requestId,
        Map<String, Object> metadata,
        Instant occurredAt
) {

    public ActivityOccurredEvent {
        // 호출부가 null 값을 신경 쓰지 않아도 되도록 null 항목은 버린다
        Map<String, Object> copied = new LinkedHashMap<>();
        if (metadata != null) {
            metadata.forEach((key, value) -> {
                if (value != null) {
                    copied.put(key, value);
                }
            });
        }
        metadata = Collections.unmodifiableMap(copied);
        occurredAt = occurredAt == null ? Instant.now() : occurredAt;
    }

    public static ActivityOccurredEvent of(ActivityEventType type, UUID memberId, Map<String, Object> metadata) {
        return new ActivityOccurredEvent(type, memberId, null, metadata, null);
    }

    public static ActivityOccurredEvent of(ActivityEventType type, UUID memberId, String requestId, Map<String, Object> metadata) {
        return new ActivityOccurredEvent(type, memberId, requestId, metadata, null);
    }

    // Map.of는 null 값을 받으면 NPE라 호출부(본 기능 코드)가 죽을 수 있다 - key, value 순서로 받아 null을 허용하는 맵을 만든다
    public static Map<String, Object> metadata(Object... keyValues) {
        if (keyValues.length % 2 != 0) {
            throw new IllegalArgumentException("metadata는 key, value 쌍으로 넘겨야 합니다.");
        }
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            map.put(String.valueOf(keyValues[i]), keyValues[i + 1]);
        }
        return map;
    }
}
