package com.dayro.global.error;

import com.dayro.activity.domain.ActivityEventType;
import com.dayro.activity.event.ActivityOccurredEvent;
import com.dayro.global.config.jwt.AuthenticatedMember;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;

import java.lang.reflect.RecordComponent;
import java.time.temporal.TemporalAccessor;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// @Valid 검증 실패(400)를 WARN 로그 + 활동 이벤트로 남긴다.
// 400은 서비스 코드까지 오지 않아 COURSE_GENERATE_FAIL로 잡히지 않고, RequestLoggingFilter는 본문을 남기지 않아
// "어떤 값을 보내서 거절됐는지"를 사후에 알 수 없었다(2026-10-07 자정 넘김 시간대 400 문의).
// 기록 실패는 삼킨다 - 집계 때문에 400 응답 자체가 500으로 바뀌면 안 된다.
@Slf4j
@Component
@RequiredArgsConstructor
public class ValidationFailureReporter {

    private static final String REQUEST_KEY_PREFIX = "request.";
    private static final int MAX_VALUE_LENGTH = 100;
    // 지금 @Valid 요청 DTO에는 없지만, 나중에 인증 관련 DTO에 @Valid가 붙어도 토큰이 저장되지 않게 이름으로 가린다
    private static final String[] SENSITIVE_NAME_PARTS = {"token", "password", "secret", "code"};

    private final ApplicationEventPublisher eventPublisher;

    public void report(HttpServletRequest request, BindingResult bindingResult, String message) {
        try {
            Map<String, Object> requestValues = requestValuesOf(bindingResult.getTarget());
            String invalidFields = bindingResult.getFieldErrors().stream()
                    .map(FieldError::getField)
                    .distinct()
                    .collect(Collectors.joining(","));

            log.warn("요청 검증 실패 - {} {}, 필드: {}, 사유: {}, 요청값: {}",
                    request.getMethod(), request.getRequestURI(), invalidFields, message, requestValues);

            Map<String, Object> metadata = ActivityOccurredEvent.metadata(
                    "method", request.getMethod(),
                    "path", request.getRequestURI(),
                    "invalidFields", invalidFields,
                    "message", message);
            requestValues.forEach((key, value) -> metadata.put(REQUEST_KEY_PREFIX + key, value));

            UUID memberId = AuthenticatedMember.currentIdOrNull();
            eventPublisher.publishEvent(
                    ActivityOccurredEvent.of(ActivityEventType.REQUEST_VALIDATION_FAIL, memberId, metadata));
        } catch (Exception e) {
            log.warn("요청 검증 실패 기록 중 오류 - {} {}", request.getMethod(), request.getRequestURI(), e);
        }
    }

    // 요청 DTO(record)의 최상위 값만 펼친다 - 활동 이벤트 metadata는 문자열/숫자/불리언만 담는 규칙이라
    // 리스트는 건수만, 그 외 객체(LocalTime, enum 등)는 문자열로 바꾼다
    private Map<String, Object> requestValuesOf(Object target) throws ReflectiveOperationException {
        Map<String, Object> values = new LinkedHashMap<>();
        if (target == null || !target.getClass().isRecord()) {
            return values;
        }
        for (RecordComponent component : target.getClass().getRecordComponents()) {
            String name = component.getName();
            Object value = component.getAccessor().invoke(target);
            if (value == null) {
                continue;
            }
            if (isSensitive(name)) {
                values.put(name, "***");
            } else if (value instanceof Collection<?> collection) {
                values.put(name + "Count", collection.size());
            } else if (value instanceof Number || value instanceof Boolean) {
                values.put(name, value);
            } else if (value instanceof CharSequence || value instanceof Enum<?> || value instanceof TemporalAccessor) {
                values.put(name, truncate(value.toString()));
            }
        }
        return values;
    }

    private boolean isSensitive(String name) {
        String lower = name.toLowerCase(Locale.ROOT);
        for (String part : SENSITIVE_NAME_PARTS) {
            if (lower.contains(part)) {
                return true;
            }
        }
        return false;
    }

    private String truncate(String value) {
        return value.length() <= MAX_VALUE_LENGTH ? value : value.substring(0, MAX_VALUE_LENGTH) + "...";
    }
}
