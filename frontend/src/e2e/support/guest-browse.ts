import type { BrowserContext } from "@playwright/test";

/**
 * 이번 방문에서 "로그인 전 둘러보기"를 고른 비회원으로 만든다(issue #230).
 * 비회원의 `/` 는 시작 화면이라, 비회원으로 홈을 확인하는 테스트는 이 쿠키를 먼저 넣는다.
 */
export async function browseAsGuest(context: BrowserContext, baseURL: string | undefined) {
  await context.addCookies([
    { name: "dayro_guest_browse", value: "1", url: new URL(baseURL ?? "http://127.0.0.1:3100").origin },
  ]);
}
