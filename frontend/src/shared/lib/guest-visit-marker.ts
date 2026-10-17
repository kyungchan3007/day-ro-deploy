/**
 * 비회원 둘러보기 "이번 방문" 표시 (issue #244).
 * - 탭 전용 저장소(sessionStorage) 값 → 탭 · 브라우저를 닫으면 사라진다
 * - 판단 결과는 `<html data-guest-visit="on">` 으로 걸어 CSS 가 비회원 `/` 의 홈 · 시작 화면 중 하나를 보여준다
 * 판단은 features/onboarding 이 하고, 로그아웃(features/auth)도 지워야 해서 shared 에 둔다.
 */
export const GUEST_VISIT_STORAGE_KEY = "dayro_guest_visit";
export const GUEST_VISIT_ATTRIBUTE = "data-guest-visit";
/**
 * 둘러보기 중이던 탭의 방문이 끝났을 때(30분 미사용 · 24시간) window 에 보내는 이벤트.
 * 숨겨지는 비회원 홈의 열린 메뉴(body 포털이라 CSS 로 함께 숨지 않음)를 닫는 데 쓴다.
 */
export const GUEST_VISIT_ENDED_EVENT = "dayro:guest-visit-ended";

/** 이번 탭의 둘러보기 표시를 지운다(로그아웃 등). 저장소가 막힌 환경은 무시한다. */
export function clearGuestVisitMarker(): void {
  try {
    window.sessionStorage.removeItem(GUEST_VISIT_STORAGE_KEY);
  } catch {
    // 저장소 접근 불가: 지울 표시도 없다
  }
  document.documentElement.removeAttribute(GUEST_VISIT_ATTRIBUTE);
}
