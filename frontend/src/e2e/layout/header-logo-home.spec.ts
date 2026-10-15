import { expect, test } from "@playwright/test";

import { browseAsGuest } from "../support/guest-browse";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

/** issue #173 (QA #14): 헤더 데이로 로고를 누르면 메인 홈으로 이동한다. */
const homeLogo = (page: import("@playwright/test").Page) =>
  page.getByRole("navigation", { name: "상단 탐색" }).getByRole("link", { name: "데이로 홈으로" });

function pathOf(page: import("@playwright/test").Page) {
  return new URL(page.url()).pathname;
}

// 비회원의 `/` 는 시작 화면(issue #230) → 둘러보기를 고른 비회원으로 로고 → 홈을 확인한다.
test.beforeEach(async ({ context, baseURL }) => {
  await browseAsGuest(context, baseURL);
});

test("the header logo on the home screen links to home", async ({ page }) => {
  await page.goto("/");
  await expect(homeLogo(page)).toHaveAttribute("href", "/");
});

test("the header logo in the situation flow goes to home", async ({ page }) => {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await expect(page.getByText("2/3")).toBeVisible();

  await homeLogo(page).click();
  await expect.poll(() => pathOf(page)).toBe("/");
  await expect(page.getByRole("heading", { name: "Dayro 홈" })).toBeAttached();
});

test("the header logo on the course screen goes to home", async ({ page }) => {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await page.getByRole("searchbox", { name: "동네 검색" }).fill("서촌");
  await page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio").first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();
  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  const placeButtons = page.getByRole("listitem").getByRole("button");
  await placeButtons.nth(0).click();
  await page.getByRole("button", { name: "선택완료" }).click();
  await expect(page.getByRole("button", { name: "경로 안내 시작하기" })).toBeVisible();

  await homeLogo(page).click();
  await expect.poll(() => pathOf(page)).toBe("/");
});

test("screens with their own header title keep the title instead of the logo link", async ({ page }) => {
  await page.goto("/faq");
  await expect(homeLogo(page)).toHaveCount(0);
});
