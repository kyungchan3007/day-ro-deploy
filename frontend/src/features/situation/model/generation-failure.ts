/**
 * 코스 생성·재추천 BFF 요청이 실패했을 때 던지는 예외.
 * `status`는 HTTP 상태, `serverMessage`는 BFF가 전달한 사용자용 문구(JSON `message`)다.
 * Cloudflare 차단 페이지처럼 JSON 이 아닌 본문이면 `serverMessage`는 비어 있다.
 */
export class CourseCandidatesRequestError extends Error {
  status: number;
  serverMessage?: string;

  constructor(code: string, status: number, serverMessage?: string) {
    super(code);
    this.name = "CourseCandidatesRequestError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

/** 메시지 없는 429(Cloudflare 요청 빈도 제한: IP당 10초 5회 초과 → 10초 차단)일 때 안내 문구. */
export const RATE_LIMITED_MESSAGE = "요청이 너무 많아요. 10초 후 다시 시도해주세요.";

const TOO_MANY_REQUESTS = 429;

/**
 * 코스 생성·재추천 실패 원인에 맞는 안내 문구를 고른다(issue #161).
 * - 429 + 서버 문구(백엔드 하루 한도 · 요청 과다 · 재추천 한도) → 서버 문구
 * - 429 + 문구 없음(Cloudflare 차단 페이지) → `RATE_LIMITED_MESSAGE`
 * - 그 밖(5xx · 네트워크 · 응답 계약 오류) → undefined (호출부 기본 문구)
 * @param error 요청 실패 예외.
 * @returns 안내 문구. 기본 문구를 쓸 경우 undefined.
 */
export function resolveGenerationFailureMessage(error: unknown): string | undefined {
  if (!(error instanceof CourseCandidatesRequestError) || error.status !== TOO_MANY_REQUESTS) {
    return undefined;
  }
  return error.serverMessage ?? RATE_LIMITED_MESSAGE;
}
