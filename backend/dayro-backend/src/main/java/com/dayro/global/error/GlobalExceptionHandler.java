package com.dayro.global.error;

import com.dayro.global.response.ApiResponse;
import io.sentry.Sentry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

// 모든 예외가 여기서 응답으로 바뀌므로 Sentry 자동 수집이 닿지 않는다 - 장애(5xx)로 볼 예외만 여기서 직접 보낸다
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(BusinessException.class)
  public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException exception) {
    ErrorCode errorCode = exception.getErrorCode();
    // 4xx는 사용자 입력/상태에 따른 정상적인 거절이라 보내지 않는다. 5xx(AI 호출 실패 등)만 장애로 본다
    if (errorCode.getStatus().is5xxServerError()) {
      captureToSentry(exception, errorCode.name());
    }

    return ResponseEntity
        .status(errorCode.getStatus())
        .body(ApiResponse.fail(exception.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException exception) {
    String message = exception.getBindingResult()
        .getFieldErrors()
        .stream()
        .findFirst()
        .map(DefaultMessageSourceResolvable::getDefaultMessage)
        .orElse(ErrorCode.INVALID_INPUT_VALUE.getMessage());

    return ResponseEntity
        .status(ErrorCode.INVALID_INPUT_VALUE.getStatus())
        .body(ApiResponse.fail(message));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleException(Exception exception) {
    // 잘못된 JSON(400), 지원하지 않는 메서드(405), 없는 경로(404) 같은 Spring MVC 예외는 클라이언트 오류다.
    // 전부 500으로 응답하면 봇/잘못된 요청까지 장애로 집계되므로 원래 상태코드로 돌려준다
    HttpStatusCode clientErrorStatus = clientErrorStatusOf(exception);
    if (clientErrorStatus != null) {
      ErrorCode errorCode = clientErrorStatus.value() == HttpStatus.NOT_FOUND.value()
          ? ErrorCode.NOT_FOUND
          : ErrorCode.INVALID_INPUT_VALUE;
      return ResponseEntity
          .status(clientErrorStatus)
          .body(ApiResponse.fail(errorCode.getMessage()));
    }

    log.error("처리되지 않은 예외", exception);
    captureToSentry(exception, ErrorCode.INTERNAL_SERVER_ERROR.name());
    return ResponseEntity
        .status(ErrorCode.INTERNAL_SERVER_ERROR.getStatus())
        .body(ApiResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR.getMessage()));
  }

  private HttpStatusCode clientErrorStatusOf(Exception exception) {
    // ErrorResponse를 구현하지 않는 요청 해석 실패 예외들
    if (exception instanceof HttpMessageNotReadableException || exception instanceof MethodArgumentTypeMismatchException) {
      return HttpStatus.BAD_REQUEST;
    }
    if (exception instanceof ErrorResponse errorResponse && errorResponse.getStatusCode().is4xxClientError()) {
      return errorResponse.getStatusCode();
    }
    return null;
  }

  private void captureToSentry(Exception exception, String errorCode) {
    Sentry.captureException(exception, scope -> scope.setTag("errorCode", errorCode));
  }
}
