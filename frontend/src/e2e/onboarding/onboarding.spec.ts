import { expect, test, type Page } from "@playwright/test";

import { bypassKakaoAuthorize, waitForCallbackRedirect } from "../support/kakao-login";

/**
 * issue #230 (QA #25): 첫 진입에서 비회원 · 회원을 나눈다.
 * 비회원 `/` → 시작 화면(카카오 로그인 · 로그인 전 둘러보기), 둘러보기 → 온보딩 3장 → 홈.
 * 회원(로그인 쿠키) `/` → 바로 홈.
 */

const startHeading = (page: Page) => page.getByRole("heading", { name: /나에게 딱 맞는 데이트 코스를/ });
const homeHeading = (page: Page) => page.getByRole("heading", { name: "Dayro 홈" });
const slideTitle = (page: Page) => page.locator("section:not([inert]) h1");

function pathOf(page: Page) {
  return new URL(page.url()).pathname;
}

test("a first-time guest sees the start screen instead of home", async ({ page }) => {
  await page.goto("/");

  await expect(startHeading(page)).toBeVisible();
  await expect(homeHeading(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "카카오 로그인" })).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인 전 둘러보기" })).toHaveAttribute("href", "/onboarding/");
  await expect(page.getByRole("link", { name: "이용약관" })).toHaveAttribute("href", "/terms/");
});

test("browsing walks through three slides, then home stays for this visit only", async ({ page, browser, baseURL }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "로그인 전 둘러보기" }).click();
  await expect.poll(() => pathOf(page)).toBe("/onboarding/");

  await expect(slideTitle(page)).toHaveText(/서울의\s*데이트 장소를 추천해드려요/);
  await expect(page.getByRole("button", { name: "다음" })).toBeVisible();
  await page.getByRole("button", { name: "다음" }).click();
  await expect(slideTitle(page)).toHaveText(/AI가 딱 맞는 장소를 찾아줘요/);
  await page.getByRole("button", { name: "다음" }).click();
  await expect(slideTitle(page)).toHaveText(/저장하고 공유해요/);

  // 마지막 장은 "시작하기" → 홈
  await page.getByRole("button", { name: "시작하기" }).click();
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(homeHeading(page)).toBeAttached();

  // 같은 방문(세션)에서는 다시 들어와도 홈
  await page.goto("/");
  await expect(homeHeading(page)).toBeAttached();

  // 새 방문(새 브라우저 세션)은 다시 시작 화면
  const fresh = await browser.newContext({ baseURL });
  const freshPage = await fresh.newPage();
  await freshPage.goto("/");
  await expect(startHeading(freshPage)).toBeVisible();
  await fresh.close();
});

test("skip goes home and the first slide's previous goes back to the start screen", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "이전" }).click();
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(startHeading(page)).toBeVisible();

  await page.goto("/onboarding");
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "건너뛰기" }).click();
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(homeHeading(page)).toBeAttached();
});

test("slides move with arrow keys and swipes, stopping at both ends", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true });
  const page = await context.newPage();
  await page.goto("/onboarding");
  const viewport = page.getByRole("group", { name: /3장 중/ });

  await viewport.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slideTitle(page)).toHaveText(/AI가/);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(slideTitle(page)).toHaveText(/서울/);

  const swipe = (from: number, to: number, fromY = 300, toY = 300) =>
    viewport.evaluate(
      (el, [startX, endX, startY, endY]) => {
        const touch = (x: number, y: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        const start = touch(startX, startY);
        el.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [start], changedTouches: [start] }));
        el.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [touch(endX, endY)] }));
      },
      [from, to, fromY, toY],
    );
  await swipe(300, 100);
  await expect(slideTitle(page)).toHaveText(/AI가/);
  await swipe(300, 280); // 50px 미만은 그대로
  await expect(slideTitle(page)).toHaveText(/AI가/);
  await swipe(300, 240, 500, 200); // 세로가 더 큰 손짓(스크롤)은 그대로
  await expect(slideTitle(page)).toHaveText(/AI가/);
  await swipe(100, 300);
  await expect(slideTitle(page)).toHaveText(/서울/);
  await context.close();
});

test("a member with a login cookie goes straight to home", async ({ page, context, baseURL }) => {
  await context.addCookies([
    { name: "dayro_access_token", value: "mock-access-token", url: new URL(baseURL!).origin },
  ]);
  await page.goto("/");
  await expect(homeHeading(page)).toBeAttached();
  await expect(startHeading(page)).toHaveCount(0);
});

test("kakao login on the start screen returns to home as a member", async ({ page }) => {
  await bypassKakaoAuthorize(page);
  await page.goto("/");
  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();
  const location = await redirect;
  expect(location.pathname).toBe("/");
  // 로컬 서버는 돌아갈 주소를 localhost 로 만들 수 있어(테스트는 127.0.0.1) 같은 주소로 다시 들어가 확인한다.
  await page.goto("/");
  await expect(homeHeading(page)).toBeAttached();
  await expect(startHeading(page)).toHaveCount(0);
});
