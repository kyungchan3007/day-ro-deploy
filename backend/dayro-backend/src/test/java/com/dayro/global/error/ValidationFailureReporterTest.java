package com.dayro.global.error;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.situation.domain.Purpose;
import com.dayro.situation.dto.request.SituationInputRequest;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.validation.beanvalidation.SpringValidatorAdapter;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class ValidationFailureReporterTest {

    private final ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);
    private final ValidationFailureReporter reporter = new ValidationFailureReporter(eventPublisher);
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    // 22:00 -> 익일 02:00은 이제 허용되므로(QA 16번) 최소 2시간 미만으로 거절되는 값을 쓴다
    void tooShortSituation_recordsRequestValuesAndReason() {
        UUID memberId = UUID.randomUUID();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(memberId.toString(), null, List.of()));
        SituationInputRequest body = new SituationInputRequest(
                LocalTime.of(22, 0), LocalTime.of(23, 0), "3120225", Purpose.FRIENDS);

        reporter.report(new MockHttpServletRequest("POST", "/api/situations"), validate(body), "데이트 시간 오류");

        ActivityOccurredEvent event = capturedEvent();
        assertThat(event.type()).isEqualTo(ActivityEventType.REQUEST_VALIDATION_FAIL);
        assertThat(event.memberId()).isEqualTo(memberId);
        assertThat(event.metadata())
                .containsEntry("method", "POST")
                .containsEntry("path", "/api/situations")
                .containsEntry("invalidFields", "durationValid")
                .containsEntry("message", "데이트 시간 오류")
                .containsEntry("request.startTime", "22:00")
                .containsEntry("request.endTime", "23:00")
                .containsEntry("request.districtId", "3120225")
                .containsEntry("request.purpose", "FRIENDS");
    }

    @Test
    void anonymousRequest_hasNoMemberAndSkipsNullValues() {
        SituationInputRequest body = new SituationInputRequest(null, LocalTime.of(14, 0), "3120225", Purpose.FRIENDS);

        reporter.report(new MockHttpServletRequest("POST", "/api/situations"), validate(body), "널 오류");

        ActivityOccurredEvent event = capturedEvent();
        assertThat(event.memberId()).isNull();
        assertThat(event.metadata())
                .containsEntry("invalidFields", "startTime")
                .doesNotContainKey("request.startTime");
    }

    @Test
    void sensitiveAndCollectionValues_areMaskedOrCounted() {
        record LoginLikeRequest(String refreshToken, List<String> places, String title) {
        }
        BindingResult bindingResult = new BeanPropertyBindingResult(
                new LoginLikeRequest("secret-token", List.of("a", "b"), "x".repeat(150)), "request");

        reporter.report(new MockHttpServletRequest("POST", "/api/test"), bindingResult, "오류");

        assertThat(capturedEvent().metadata())
                .containsEntry("request.refreshToken", "***")
                .containsEntry("request.placesCount", 2)
                .containsEntry("request.title", "x".repeat(100) + "...")
                .doesNotContainKey("request.places");
    }

    @Test
    void publishFailure_isSwallowed() {
        doThrow(new IllegalStateException("boom")).when(eventPublisher).publishEvent(any(Object.class));
        SituationInputRequest body = new SituationInputRequest(
                LocalTime.of(22, 0), LocalTime.of(23, 0), "3120225", Purpose.FRIENDS);

        assertThatCode(() -> reporter.report(new MockHttpServletRequest("POST", "/api/situations"), validate(body), "오류"))
                .doesNotThrowAnyException();
    }

    private BindingResult validate(Object target) {
        BindingResult bindingResult = new BeanPropertyBindingResult(target, "request");
        new SpringValidatorAdapter(validator).validate(target, bindingResult);
        return bindingResult;
    }

    private ActivityOccurredEvent capturedEvent() {
        ArgumentCaptor<ActivityOccurredEvent> captor = ArgumentCaptor.forClass(ActivityOccurredEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        return captor.getValue();
    }
}
