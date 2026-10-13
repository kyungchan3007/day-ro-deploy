import { expect, test, type Page } from "@playwright/test";

import { bypassKakaoAuthorize, waitForCallbackRedirect } from "../support/kakao-login";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/** 상황입력 2단계(지역)까지 진행한다. */
async function goToRegionStep(page: Page) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await expect(page.getByText("2/3")).toBeVisible();
  await expect.poll(() => stepOf(page)).toBe("region");
  return new URL(page.url());
}

async function openMenuLogin(page: Page) {
  await page.getByRole("button", { name: "메뉴" }).click();
  await page.getByRole("link", { name: "로그인", exact: true }).click();
}

/**
 * issue #181 (QA #21): 상황입력 중 메뉴로 로그인하면 홈으로 갔다.
 * 로그인 후 입력하던 단계 · 입력값으로 돌아와야 한다.
 */
test("menu login during the situation flow returns to the same step after login", async ({ page }) => {
  await bypassKakaoAuthorize(page);
  const regionUrl = await goToRegionStep(page);

  await openMenuLogin(page);
  await expect(page).toHaveURL(/\/login\/?\?next=/);
  const next = new URL(page.url()).searchParams.get("next");
  expect(next, "로그인 후 돌아올 주소는 지역 단계(step · rev 포함)").toBe(
    `${regionUrl.pathname}${regionUrl.search}`,
  );

  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();
  const location = await redirect;
  expect(`${location.pathname}${location.search}`).toBe(next);
});

test("returning in a new tab after menu login restores the step and inputs", async ({ page, context }) => {
  await goToRegionStep(page);
  await openMenuLogin(page);
  await expect(page).toHaveURL(/\/login\/?\?next=/);
  const next = new URL(page.url()).searchParams.get("next")!;

  // 모바일 카카오 로그인처럼 새 탭(sessionStorage 없음)으로 돌아온 상황
  const returned = await context.newPage();
  await returned.goto(next);
  await expect.poll(() => stepOf(returned), { message: "1단계(time)로 가면 안 됩니다." }).toBe("region");
  await expect(returned.getByText("2/3")).toBeVisible();
  // 1단계에서 정한 시간(기본 6시간)이 요약 칩으로 남아 있다.
  await expect(returned.getByRole("button", { name: /시간 수정/ })).toBeVisible();
});

test("menu login from a static screen returns to that screen", async ({ page }) => {
  await page.goto("/faq");
  await page.waitForLoadState("networkidle");
  await openMenuLogin(page);
  await expect(page).toHaveURL(/\/login\/?\?next=%2Ffaq/);
});

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";

/** 로그인된 상태로 상황입력 2단계까지 진행하고, 로그아웃은 성공 응답으로 처리한다. */
async function goToRegionStepLoggedIn(page: Page, baseURL: string | undefined) {
  const base = new URL(baseURL ?? "http://localhost:3000");
  await page.goto(base.origin);
  await page.evaluate((cookieName) => {
    document.cookie = `${cookieName}=mock-access-token; path=/; SameSite=Lax`;
  }, ACCESS_TOKEN_COOKIE_NAME);
  await page.route("**/api/auth/logout**", (route) =>
    route.fulfill({ status: 200, json: { success: true, message: "로그아웃 되었습니다.", data: null } }),
  );
  return goToRegionStep(page);
}

async function logoutFromMenu(page: Page) {
  await page.getByRole("button", { name: "메뉴" }).click();
  await page.getByRole("button", { name: "로그아웃" }).click();
  await page.getByRole("dialog", { name: "로그아웃 하시겠어요?" }).getByRole("button", { name: "로그아웃" }).click();
}

/**
 * issue #181 (QA #21 후속): 상황입력 중 로그아웃 → 다시 로그인하면 홈으로 갔다.
 * 로그아웃 후 로그인 화면도 돌아올 화면을 기억해, 다시 로그인하면 그 단계로 돌아와야 한다.
 */
test("logging out during the situation flow and logging in again returns to the same step", async ({
  page,
  baseURL,
}) => {
  const regionUrl = await goToRegionStepLoggedIn(page, baseURL);
  await bypassKakaoAuthorize(page);

  await logoutFromMenu(page);
  await expect(page).toHaveURL(/\/login\/?\?/);
  const loginUrl = new URL(page.url());
  expect(loginUrl.searchParams.get("notice")).toBe("logged_out");
  const next = loginUrl.searchParams.get("next");
  expect(next, "다시 로그인하면 돌아올 주소는 지역 단계").toBe(`${regionUrl.pathname}${regionUrl.search}`);

  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();
  const location = await redirect;
  expect(`${location.pathname}${location.search}`).toBe(next);
});

test("after logging out, returning in a new tab restores the step and inputs", async ({ page, context, baseURL }) => {
  await goToRegionStepLoggedIn(page, baseURL);
  await logoutFromMenu(page);
  await expect(page).toHaveURL(/\/login\/?\?/);
  const next = new URL(page.url()).searchParams.get("next")!;

  const returned = await context.newPage();
  await returned.goto(next);
  await expect.poll(() => stepOf(returned), { message: "1단계(time)로 가면 안 됩니다." }).toBe("region");
  await expect(returned.getByRole("button", { name: /시간 수정/ })).toBeVisible();
});
