import { encodeNextPathParam } from "./next-path-param";

/**
 * 로그인 후 돌아올 경로를 담은 로그인 주소를 만든다.
 * next 의 안전성(내부 경로 여부)은 로그인 쪽(`sanitizeLoginNextPath`)이 다시 검증한다.
 * @param nextPath 로그인 후 돌아갈 내부 경로(쿼리 포함 가능).
 * @returns `/login?next=<인코딩된 경로>`
 */
export function buildLoginRedirectPath(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

/**
 * 로그아웃 뒤 첫 화면(`/` 비회원 시작 화면)으로 보내면서, 다시 로그인하면 돌아갈 경로를 함께 넘긴다(issue #181 · #244).
 * 시작 화면의 카카오 로그인이 이 next 를 받아 로그인 뒤 그 화면(상황입력 단계 등)으로 돌려보낸다.
 * next 의 안전성은 받는 쪽(`sanitizeLoginNextPath`)이 다시 검증한다.
 * @param nextPath 다시 로그인하면 돌아갈 내부 경로. 없으면 `/`.
 * @returns `/` 또는 `/?next=<인코딩된 경로>`
 */
export function buildStartScreenPath(nextPath?: string | null): string {
  return nextPath ? `/?next=${encodeURIComponent(nextPath)}` : "/";
}

/** 세션 복구 Route Handler 경로. trailingSlash 설정 때문에 끝 슬래시를 붙여 리다이렉트 없이 받는다. */
export const SESSION_RESTORE_PATH = "/api/auth/restore/";

/**
 * refresh token 으로 세션을 복구한 뒤 원래 화면으로 돌아오는 주소를 만든다(issue #146).
 * next 의 안전성은 복구 Route Handler 가 `sanitizeLoginNextPath` 로 다시 검증한다.
 * Route Handler 로 가는 값이라 운영(Workers)에서 `&` 가 잘리지 않도록 base64url 로 감싼다(issue #200).
 * @param nextPath 복구 후 돌아갈 내부 경로.
 * @returns `/api/auth/restore/?next=<base64url 경로>`
 */
export function buildSessionRestorePath(nextPath: string): string {
  return `${SESSION_RESTORE_PATH}?next=${encodeNextPathParam(nextPath)}`;
}
