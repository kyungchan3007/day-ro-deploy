package com.dayro.global.error;

import io.sentry.ScopeCallback;
import io.sentry.Sentry;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.web.HttpRequestMethodNotSupportedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockStatic;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void serverSideBusinessException_isSentToSentry() {
        BusinessException exception = new BusinessException(ErrorCode.AI_CALL_FAILED);
        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            var response = handler.handleBusinessException(exception);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
            sentry.verify(() -> Sentry.captureException(eq(exception), any(ScopeCallback.class)));
        }
    }

    @Test
    void clientSideBusinessException_isNotSentToSentry() {
        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            var response = handler.handleBusinessException(new BusinessException(ErrorCode.REGION_NOT_FOUND));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            sentry.verifyNoInteractions();
        }
    }

    @Test
    void unexpectedException_isSentToSentryAndHidesDetails() {
        IllegalStateException exception = new IllegalStateException("내부 상세 메시지");
        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            var response = handler.handleException(exception);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            assertThat(response.getBody().getMessage()).isEqualTo(ErrorCode.INTERNAL_SERVER_ERROR.getMessage());
            sentry.verify(() -> Sentry.captureException(eq(exception), any(ScopeCallback.class)));
        }
    }

    @Test
    void malformedJson_isBadRequestAndNotSentToSentry() {
        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            var response = handler.handleException(
                    new HttpMessageNotReadableException("bad json", new MockHttpInputMessage(new byte[0])));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            sentry.verifyNoInteractions();
        }
    }

    @Test
    void unsupportedMethod_keepsItsStatusAndNotSentToSentry() {
        try (MockedStatic<Sentry> sentry = mockStatic(Sentry.class)) {
            var response = handler.handleException(new HttpRequestMethodNotSupportedException("GET"));

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
            sentry.verifyNoInteractions();
        }
    }
}
