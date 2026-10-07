package com.dayro.activity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

// 사용자 활동 로그 - 한 번 쌓이면 수정하지 않는 append-only 테이블
// member_id는 FK를 걸지 않는다: 탈퇴 시 회원 행은 삭제되지만 통계는 남아야 하므로, 탈퇴 시점에 null로 비식별화한다
@Entity
@Table(name = "activity_events", indexes = {
        @Index(name = "idx_activity_events_type_occurred_at", columnList = "event_type, occurred_at"),
        @Index(name = "idx_activity_events_member_id", columnList = "member_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ActivityEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Convert(converter = ActivityEventTypeConverter.class)
    @Column(name = "event_type", nullable = false, length = 40)
    private ActivityEventType eventType;

    @Column(name = "member_id", columnDefinition = "uuid")
    private UUID memberId;

    // 비회원 식별용 기기 ID - 프론트에서 헤더로 넘겨주기 전까지는 항상 null
    @Column(name = "device_id", length = 64)
    private String deviceId;

    // 코스 생성 세션(requestId) - 생성/다른 코스 보기를 한 세션으로 묶는다
    @Column(name = "request_id", length = 64)
    private String requestId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> metadata = new HashMap<>();

    // 서버 로컬 시간대(UTC)에 휘둘리지 않도록 timestamptz로 저장한다 - 일자 집계는 쿼리에서 AT TIME ZONE 'Asia/Seoul'로 한다
    @Column(name = "occurred_at", nullable = false)
    private Instant occurredAt;

    @Builder
    public ActivityEvent(ActivityEventType eventType, UUID memberId, String deviceId, String requestId,
                         Map<String, Object> metadata, Instant occurredAt) {
        this.eventType = eventType;
        this.memberId = memberId;
        this.deviceId = deviceId;
        this.requestId = requestId;
        this.metadata = metadata == null ? new HashMap<>() : new HashMap<>(metadata);
        this.occurredAt = occurredAt;
    }
}
