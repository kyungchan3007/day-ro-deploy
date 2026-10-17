/**
 * 첫 진입(`/`) 화면 결정 규칙 (issue #230, QA #25 · #244).
 *
 * - 로그인 쿠키(access 또는 refresh)가 있으면 회원 → 홈만
 * - 비회원 → 시작 화면 · 홈을 함께 내려보내고, 이번 탭에서 둘러보기를 골랐는지(탭 표시)로 브라우저가 하나만 보여준다
 *   (탭마다 다를 수 있어 서버 쿠키로는 못 고른다 → `model/guest-visit`)
 * 쿠키가 있는지만 본다(백엔드 호출 없음). 만료된 토큰이면 홈의 계정 메뉴가 비로그인으로 보여준다.
 */

/** 둘러보기를 고른 뒤 최대 유지 시간(계속 쓰고 있어도 이 시간이 지나면 다시 시작 화면). */
export const GUEST_BROWSE_MAX_AGE_SECONDS = 60 * 60 * 24;

export type RootEntry = "member" | "guest";

export interface RootEntryCookies {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}

export function resolveRootEntry({ hasAccessToken, hasRefreshToken }: RootEntryCookies): RootEntry {
  return hasAccessToken || hasRefreshToken ? "member" : "guest";
}
