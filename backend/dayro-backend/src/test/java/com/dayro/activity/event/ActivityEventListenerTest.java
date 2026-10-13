package com.dayro.activity.event;

import com.dayro.activity.domain.ActivityEvent;
import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.repository.ActivityEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class ActivityEventListenerTest {

    @Mock
    ActivityEventRepository activityEventRepository;
    @Mock
    StringRedisTemplate redisTemplate;
    @Mock
    ValueOperations<String, String> valueOperations;

    @InjectMocks
    ActivityEventListener listener;

    @Test
    void memberEvent_savesEventAndFirstActiveOfTheDay() {
        UUID memberId = UUID.randomUUID();
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.setIfAbsent(anyString(), eq("1"), any(Duration.class))).willReturn(true);

        listener.handle(ActivityOccurredEvent.of(ActivityEventType.COURSE_SAVE, memberId, Map.of("placeCount", 3)));

        ArgumentCaptor<ActivityEvent> captor = ArgumentCaptor.forClass(ActivityEvent.class);
        verify(activityEventRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).extracting(ActivityEvent::getEventType)
                .containsExactly(ActivityEventType.COURSE_SAVE, ActivityEventType.ACTIVE);
        assertThat(captor.getAllValues().get(1).getMetadata()).containsEntry("trigger", "COURSE_SAVE");
    }

    @Test
    void active_alreadyRecordedToday_isNotSavedAgain() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.setIfAbsent(anyString(), eq("1"), any(Duration.class))).willReturn(false);

        listener.handle(ActivityOccurredEvent.of(ActivityEventType.ACTIVE, UUID.randomUUID(), Map.of()));

        verify(activityEventRepository, never()).save(any());
    }

    @Test
    void activeKey_usesKstDate() {
        UUID memberId = UUID.randomUUID();
        // UTC 2026-10-05 15:30 = KST 2026-10-06 00:30 - 서버(UTC) 날짜가 아니라 한국 날짜로 하루를 나눠야 한다
        Instant occurredAt = Instant.parse("2026-10-05T15:30:00Z");
        given(redisTemplate.opsForValue()).willReturn(valueOperations);

        listener.handle(new ActivityOccurredEvent(ActivityEventType.ACTIVE, memberId, null, Map.of(), occurredAt));

        verify(valueOperations).setIfAbsent(eq("activity:active:2026-10-06:" + memberId), eq("1"), any(Duration.class));
    }

    @Test
    void anonymousEvent_doesNotTouchDailyActive() {
        listener.handle(ActivityOccurredEvent.of(ActivityEventType.COURSE_GENERATE, null, "req-1", Map.of()));

        verify(activityEventRepository).save(any(ActivityEvent.class));
        verifyNoInteractions(redisTemplate);
    }

    @Test
    void withdraw_isNotCountedAsActive() {
        listener.handle(ActivityOccurredEvent.of(ActivityEventType.WITHDRAW, UUID.randomUUID(), Map.of()));

        verify(activityEventRepository).save(any(ActivityEvent.class));
        verifyNoInteractions(redisTemplate);
    }

    @Test
    void saveFailure_isSwallowed() {
        given(activityEventRepository.save(any())).willThrow(new IllegalStateException("db down"));

        assertThatCode(() -> listener.handle(ActivityOccurredEvent.of(ActivityEventType.COURSE_GENERATE, null, Map.of())))
                .doesNotThrowAnyException();
    }

    @Test
    void metadata_dropsNullValues() {
        ActivityOccurredEvent event = ActivityOccurredEvent.of(ActivityEventType.COURSE_VIEW, null,
                ActivityOccurredEvent.metadata("courseId", "c1", "daysSinceSaved", null));

        assertThat(event.metadata()).containsOnlyKeys("courseId");
    }
}
