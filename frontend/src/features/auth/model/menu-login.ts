import { buildLoginRedirectPath } from "@/shared/lib/login-redirect";

/**
 * 로그인 화면으로 떠날 때 돌아올 화면 (QA #21, issue #181).
 *
 * 메뉴 "로그인" · 로그아웃 모두 로그인 화면으로 이동하는데, 다시 로그인하면
 * 떠나기 전 화면(상황입력 단계 · rev 포함)으로 돌아오도록 현재 경로 · 쿼리를 next 로 넘긴다.
 * 홈 · 로그인 화면에서는 돌아올 곳이 따로 없으므로 next 를 두지 않는다.
 * next 의 안전성은 로그인 쪽(`sanitizeLoginNextPath`)이 다시 검증한다.
 * @param pathname 현재 경로.
 * @param search 현재 쿼리(`?` 포함 또는 빈 문자열).
 * @returns 돌아올 경로. 없으면 null.
 */
export function resolveLoginReturnPath(pathname: string, search: string): string | null {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/" || normalized === "/login") {
    return null;
  }
  return `${pathname}${search}`;
}

/**
 * 계정 메뉴 "로그인"이 이동할 주소.
 * @param pathname 현재 경로.
 * @param search 현재 쿼리(`?` 포함 또는 빈 문자열).
 * @returns 로그인 주소(돌아올 화면이 있으면 next 포함).
 */
export function buildMenuLoginPath(pathname: string, search: string): string {
  const next = resolveLoginReturnPath(pathname, search);
  return next ? buildLoginRedirectPath(next) : "/login";
}
