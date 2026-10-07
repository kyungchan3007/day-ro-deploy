import "server-only";

import { NextResponse } from "next/server";

/**
 * 외부 백엔드가 오류 상태로 응답했을 때 던지는 예외.
 * `status`는 백엔드 HTTP 상태, `message`는 사용자에게 보여도 되는 문구다
 * (백엔드 `ApiResponse.message` 또는 호출부 fallback — 파싱 오류·내부 예외 문구는 담지 않는다).
 */
export class BackendApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

/**
 * 백엔드 응답 본문을 한 번만 읽어 JSON 으로 해석한다.
 * 빈 본문이나 JSON 이 아닌 본문(프록시·CDN 의 HTML 오류 페이지 등)은 예외 대신 `null`을 돌려준다.
 * 파싱 오류 문구(`Unexpected token <` 등)가 사용자 응답으로 새지 않게 하기 위함이다(issue #139 S8).
 */
export async function readBackendJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * 백엔드 `ApiResponse` 형식의 `message`가 있으면 그 문구를, 없으면 fallback 을 돌려준다.
 * 백엔드 문구는 ErrorCode·검증 메시지로 관리되는 사용자용 문구다.
 */
export function getBackendErrorMessage(json: unknown, fallbackMessage: string): string {
  if (typeof json === "object" && json !== null && "message" in json) {
    const { message } = json;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }
  return fallbackMessage;
}

/**
 * 백엔드 오류 응답을 `BackendApiError`로 바꾼다.
 * 4xx·503 은 백엔드 문구를 그대로 쓰고, 그 밖의 5xx 는 호출부 fallback 문구를 쓴다.
 * @param response 백엔드 응답(`ok`가 아님).
 * @param json `readBackendJson`으로 읽은 본문.
 * @param fallbackMessage 엔드포인트별 기본 문구.
 */
export function toBackendApiError(
  response: Response,
  json: unknown,
  fallbackMessage: string,
): BackendApiError {
  const useBackendMessage =
    (response.status >= 400 && response.status < 500) || response.status === 503;
  return new BackendApiError(
    response.status,
    useBackendMessage ? getBackendErrorMessage(json, fallbackMessage) : fallbackMessage,
  );
}

/**
 * 백엔드가 인증 정보를 거절했는지(토큰 무효·만료·형식 오류). 장애(5xx·네트워크)와 구분할 때 쓴다.
 */
export function isBackendAuthRejection(error: unknown): boolean {
  return (
    error instanceof BackendApiError &&
    (error.status === 400 || error.status === 401 || error.status === 403)
  );
}

/**
 * BFF 가 브라우저에 돌려줄 상태코드.
 * - 백엔드 4xx(400·401·403·404·409·429 …)는 그대로 전달해 클라이언트가 원인을 구분할 수 있게 한다.
 * - 503(AI 일시 장애 등)은 그대로 전달한다.
 * - 그 밖의 5xx 는 502(게이트웨이 오류)로 정규화한다.
 */
export function toBffErrorStatus(status: number): number {
  if (status >= 400 && status < 500) {
    return status;
  }
  if (status === 503) {
    return 503;
  }
  return 502;
}

/**
 * BFF 공통 오류 응답(`{ success: false, message, data }`).
 * - `BackendApiError`: 상태는 `toBffErrorStatus`, 문구는 예외에 담긴 사용자용 문구.
 * - 그 밖의 예외(네트워크 실패·응답 계약 불일치 등): 502 + fallback 문구. 원래 예외 문구는 서버 로그에만 남긴다.
 * @param error 잡은 예외.
 * @param fallbackMessage 엔드포인트별 기본 문구.
 * @param emptyData 실패 시 `data` 값(엔드포인트 계약에 맞춰 `null` 또는 `[]`).
 */
export function bffErrorResponse(
  error: unknown,
  fallbackMessage: string,
  emptyData: null | [] = null,
): NextResponse {
  if (error instanceof BackendApiError) {
    return NextResponse.json(
      { success: false, message: error.message, data: emptyData },
      { status: toBffErrorStatus(error.status) },
    );
  }

  console.error("[BFF] 백엔드 요청 처리 실패", error);
  return NextResponse.json(
    { success: false, message: fallbackMessage, data: emptyData },
    { status: 502 },
  );
}
