package com.dayro.global.error;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

  INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "잘못된 요청 값입니다."),
  UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
  FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
  NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
  INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."),

  KAKAO_AUTH_FAILED(HttpStatus.UNAUTHORIZED, "카카오 인증에 실패했습니다."),
  INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
  MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "회원 정보를 찾을 수 없습니다."),

  REGION_NOT_FOUND(HttpStatus.NOT_FOUND, "선택한 지역 정보를 찾을 수 없습니다."),
  NO_PLACES_FOUND(HttpStatus.NOT_FOUND, "조건에 맞는 장소를 찾지 못했어요. 다시 선택해주세요."),
  PLACE_PHOTO_NOT_FOUND(HttpStatus.NOT_FOUND, "장소 사진을 불러오지 못했어요."),
  COURSE_NOT_FOUND(HttpStatus.NOT_FOUND, "저장된 코스를 찾을 수 없습니다."),
  COURSE_PLACE_MINIMUM_NOT_MET(HttpStatus.BAD_REQUEST, "시간대별 최소 장소 개수를 유지해야 합니다."),
  AI_CALL_FAILED(HttpStatus.SERVICE_UNAVAILABLE, "코스를 불러오지 못했어요. 잠시 후 다시 시도해주세요."),
  DAILY_API_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "오늘의 코스 추천 요청 한도를 모두 사용했어요. 내일 다시 이용해주세요."),
  COURSE_REQUEST_NOT_FOUND(HttpStatus.NOT_FOUND, "코스 요청 정보를 찾을 수 없거나 만료되었어요. 처음부터 다시 시도해주세요."),
  COURSE_RETRY_LIMIT_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, "다른 코스 보기를 모두 사용했어요.");

  private final HttpStatus status;
  private final String message;

  ErrorCode(HttpStatus status, String message) {
    this.status = status;
    this.message = message;
  }
}
