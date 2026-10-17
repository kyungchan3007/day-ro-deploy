package com.dayro.global.quota;

import com.dayro.global.error.BusinessException;
import io.sentry.Sentry;
import io.sentry.SentryLevel;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mockStatic;

@ExtendWith(MockitoExtension.class)
class DailyCallBudgetTest {

    @Mock
    StringRedisTemplate redisTemplate;
    @Mock
    ValueOperations<String, String> valueOperations;

    @InjectMocks
    DailyCallBudget dailyCallBudget;

    @Test
    void firstExceedOfTheDay_alertsSentryOnce() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.increment(anyString())).willReturn(51L);

        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            assertThatThrownBy(() -> dailyCallBudget.consume("gemini-course-selection", 50))
                    .isInstanceOf(BusinessException.class);

            sentry.verify(() -> Sentry.captureMessage(anyString(), eq(SentryLevel.WARNING)));
        }
    }

    @Test
    void laterExceeds_doNotAlertAgain() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.increment(anyString())).willReturn(52L);

        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            assertThatThrownBy(() -> dailyCallBudget.consume("gemini-course-selection", 50))
                    .isInstanceOf(BusinessException.class);

            sentry.verifyNoInteractions();
        }
    }
}
