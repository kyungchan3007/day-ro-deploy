import type { BrowserContext } from "@playwright/test";

/**
 * 이번 탭에서 "로그인 전 둘러보기"를 고른 비회원으로 만든다(issue #230 · #244).
 * 비회원의 `/` 는 이번 탭 표시(sessionStorage)가 있어야 홈을 보여준다 → 모든 탭에 표시를 미리 넣는다.
 */
export async function browseAsGuest(context: BrowserContext, baseURL: string | undefined) {
  void baseURL;
  await context.addInitScript(() => {
    try {
      const now = Date.now();
      window.sessionStorage.setItem("dayro_guest_visit", JSON.stringify({ startedAt: now, lastActiveAt: now }));
    } catch {
      // 저장소가 막힌 환경은 테스트 대상 아님
    }
  });
}
