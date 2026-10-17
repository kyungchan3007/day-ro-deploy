import { expect, test, type Page } from "@playwright/test";

import { bypassKakaoAuthorize, waitForCallbackRedirect } from "../support/kakao-login";

/**
 * issue #230 (QA #25): 첫 진입에서 비회원 · 회원을 나눈다.
 * 비회원 `/` → 시작 화면(카카오 로그인 · 로그인 전 둘러보기), 둘러보기 → 온보딩 3장 → 홈.
 * 회원(로그인 쿠키) `/` → 바로 홈.
 */

const startHeading = (page: Page) => page.getByRole("heading", { name: /나에게 딱 맞는 데이트 코스를/ });
const homeHeading = (page: Page) => page.getByRole("heading", { name: "Dayro 홈" });
// 비회원 `/` 에는 시작 화면 · 홈이 함께 내려오고 CSS 가 하나만 보여준다(issue #244) → 붙어 있는지가 아니라 보이는지로 확인
const seesHome = async (page: Page) => {
  await expect(homeHeading(page)).toBeVisible();
  await expect(startHeading(page)).toBeHidden();
};
const seesStart = async (page: Page) => {
  await expect(startHeading(page)).toBeVisible();
  await expect(homeHeading(page)).toBeHidden();
};
const slideTitle = (page: Page) => page.locator("section:not([inert]) h1");

function pathOf(page: Page) {
  return new URL(page.url()).pathname;
}

test("a first-time guest sees the start screen instead of home", async ({ page }) => {
  await page.goto("/");

  await seesStart(page);
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
  await seesHome(page);

  // 같은 방문(세션)에서는 다시 들어와도 홈
  await page.goto("/");
  await seesHome(page);

  // 새 방문(새 브라우저 세션)은 다시 시작 화면
  const fresh = await browser.newContext({ baseURL });
  const freshPage = await fresh.newPage();
  await freshPage.goto("/");
  await seesStart(freshPage);
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
  await seesHome(page);
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
  await seesHome(page);
  await expect(startHeading(page)).toHaveCount(0); // 회원은 홈만 내려온다
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
  await seesHome(page);
  await expect(startHeading(page)).toHaveCount(0); // 회원은 홈만 내려온다
});

/** issue #244: 둘러보기는 이번 탭에서만, 30분 미사용 · 24시간이 지나면 새 방문. 로그아웃하면 바로 시작 화면. */
const visitMarker = (page: Page) => page.evaluate(() => window.sessionStorage.getItem("dayro_guest_visit"));

async function skipToHome(page: Page) {
  await page.goto("/onboarding");
  await page.getByRole("button", { name: "건너뛰기" }).click();
  await expect.poll(() => pathOf(page)).toBe("/");
  await seesHome(page);
}

test("the browse choice is remembered per tab and no guest cookie is used", async ({ page }) => {
  await skipToHome(page);
  const marker = JSON.parse((await visitMarker(page))!);
  expect(typeof marker.startedAt).toBe("number");
  expect(typeof marker.lastActiveAt).toBe("number");
  expect((await page.context().cookies()).some((cookie) => cookie.name === "dayro_guest_browse")).toBe(false);
});

test("logging out goes straight to the start screen", async ({ page, baseURL }) => {
  await skipToHome(page);
  await page.context().addCookies([
    { name: "dayro_access_token", value: "mock-access-token", url: new URL(baseURL!).origin },
  ]);
  await page.goto("/");
  await expect(homeHeading(page)).toBeVisible();

  await page.getByRole("button", { name: "메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.getByRole("dialog", { name: "로그아웃 하시겠어요?" }).getByRole("button", { name: "로그아웃" }).click();

  await expect.poll(() => pathOf(page)).toBe("/");
  await seesStart(page);
  expect(await visitMarker(page)).toBeNull();
});

test("closing the site and coming back shows the start screen again, even within 24 hours", async ({ page, context }) => {
  await skipToHome(page);

  // 같은 탭에서 새로고침 · 다른 화면을 오가도 홈 유지
  await page.reload();
  await seesHome(page);
  await page.goto("/faq");
  await page.goto("/");
  await seesHome(page);

  // 탭을 닫고 새 탭으로 다시 들어옴(이번 탭 표시 없음) → 시작 화면
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  await seesStart(reopened);
});

test("coming back after 30 idle minutes counts as a new visit (restored tab)", async ({ page }) => {
  await skipToHome(page);
  // 탭 복원처럼 표시는 남아 있지만 마지막 사용이 31분 전
  await page.evaluate(() => {
    const raw = JSON.parse(window.sessionStorage.getItem("dayro_guest_visit")!);
    window.sessionStorage.setItem(
      "dayro_guest_visit",
      JSON.stringify({ startedAt: raw.startedAt, lastActiveAt: Date.now() - 31 * 60 * 1000 }),
    );
  });
  await page.reload();
  await seesStart(page);
  expect(await visitMarker(page)).toBeNull();
});

test("returning to an idle tab switches / to the start screen without reloading", async ({ page }) => {
  await skipToHome(page);
  await page.evaluate(() => {
    const raw = JSON.parse(window.sessionStorage.getItem("dayro_guest_visit")!);
    window.sessionStorage.setItem(
      "dayro_guest_visit",
      JSON.stringify({ startedAt: raw.startedAt, lastActiveAt: Date.now() - 31 * 60 * 1000 }),
    );
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await seesStart(page);
});

test("a new tab starts a new visit, but the tab already open keeps home", async ({ page, context }) => {
  await skipToHome(page);

  const other = await context.newPage();
  await other.goto("/");
  await seesStart(other);

  // 새 탭이 있어도 기존 탭은 그대로 홈 (새로고침 · 화면 이동 포함)
  await page.bringToFront();
  await page.reload();
  await seesHome(page);
  await page.goto("/faq");
  await page.goto("/");
  await seesHome(page);

  // 새 탭도 화면을 오가도 시작 화면 그대로
  await other.goto("/faq");
  await other.goto("/");
  await seesStart(other);
});

test("the hidden home's closed menu is not reachable with Tab on the start screen", async ({ page }) => {
  await page.goto("/");
  await seesStart(page);
  const focused: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    await page.keyboard.press("Tab");
    focused.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return "body";
        const hiddenHome = !!el.closest(".guest-entry-home");
        const inDrawer = !!el.closest('[role="dialog"]');
        const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        return `${el.tagName}:${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 12)}:${hiddenHome ? "hiddenHome" : ""}${inDrawer ? "drawer" : ""}${visible ? "" : "invisible"}`;
      }),
    );
  }
  expect(focused.filter((item) => /hiddenHome|drawer|invisible/.test(item))).toEqual([]);
});

test("an open account menu closes when the browse visit ends", async ({ page }) => {
  await skipToHome(page);
  await page.getByRole("button", { name: "메뉴" }).click();
  await expect(page.getByRole("dialog", { name: "계정 메뉴" })).toBeVisible();

  await page.evaluate(() => {
    const raw = JSON.parse(window.sessionStorage.getItem("dayro_guest_visit")!);
    window.sessionStorage.setItem(
      "dayro_guest_visit",
      JSON.stringify({ startedAt: raw.startedAt, lastActiveAt: Date.now() - 31 * 60 * 1000 }),
    );
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await seesStart(page);
  await expect(page.getByRole("dialog", { name: "계정 메뉴" })).toBeHidden();
});
