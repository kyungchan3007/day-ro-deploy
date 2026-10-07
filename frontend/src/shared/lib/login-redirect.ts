/**
 * 로그인 후 돌아올 경로를 담은 로그인 주소를 만든다.
 * next 의 안전성(내부 경로 여부)은 로그인 쪽(`sanitizeLoginNextPath`)이 다시 검증한다.
 * @param nextPath 로그인 후 돌아갈 내부 경로(쿼리 포함 가능).
 * @returns `/login?next=<인코딩된 경로>`
 */
export function buildLoginRedirectPath(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

/** 세션 복구 Route Handler 경로. trailingSlash 설정 때문에 끝 슬래시를 붙여 리다이렉트 없이 받는다. */
export const SESSION_RESTORE_PATH = "/api/auth/restore/";

/**
 * refresh token 으로 세션을 복구한 뒤 원래 화면으로 돌아오는 주소를 만든다(issue #146).
 * next 의 안전성은 복구 Route Handler 가 `sanitizeLoginNextPath` 로 다시 검증한다.
 * @param nextPath 복구 후 돌아갈 내부 경로.
 * @returns `/api/auth/restore/?next=<인코딩된 경로>`
 */
export function buildSessionRestorePath(nextPath: string): string {
  return `${SESSION_RESTORE_PATH}?next=${encodeURIComponent(nextPath)}`;
}
