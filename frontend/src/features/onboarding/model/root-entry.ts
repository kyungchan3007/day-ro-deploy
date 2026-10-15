/**
 * 첫 진입(`/`) 화면 결정 규칙 (issue #230, QA #25).
 *
 * - 로그인 쿠키(access 또는 refresh)가 있으면 회원 → 홈
 * - 비회원이 이번 방문에서 "로그인 전 둘러보기"를 골랐으면 → 홈
 * - 그 밖의 비회원 → 시작 화면
 * 쿠키가 있는지만 본다(백엔드 호출 없음). 만료된 토큰이면 홈의 계정 메뉴가 비로그인으로 보여준다.
 */

/**
 * 비회원 둘러보기 선택. 만료 없는 세션 쿠키 → 브라우저 세션이 끝나면 사라져 다음 방문엔 다시 시작 화면.
 * 탭만 닫거나 브라우저가 이전 세션을 복원하면 남을 수 있다(브라우저 세션 정책을 따른다).
 */
export const GUEST_BROWSE_COOKIE_NAME = "dayro_guest_browse";
export const GUEST_BROWSE_COOKIE_VALUE = "1";

export type RootEntry = "home" | "start";

export interface RootEntryCookies {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  guestBrowse: string | undefined;
}

export function resolveRootEntry({ hasAccessToken, hasRefreshToken, guestBrowse }: RootEntryCookies): RootEntry {
  if (hasAccessToken || hasRefreshToken) return "home";
  return guestBrowse === GUEST_BROWSE_COOKIE_VALUE ? "home" : "start";
}

/** 둘러보기 선택을 기록할 쿠키 문자열. https 에서만 Secure 를 붙인다(로컬 http 개발 · e2e 허용). */
export function buildGuestBrowseCookie(secure: boolean): string {
  const parts = [`${GUEST_BROWSE_COOKIE_NAME}=${GUEST_BROWSE_COOKIE_VALUE}`, "path=/", "SameSite=Lax"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
