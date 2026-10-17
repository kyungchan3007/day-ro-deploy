import { expect, test } from "@playwright/test";

import { browseAsGuest } from "../support/guest-browse";

// 비회원의 `/` 는 시작 화면(issue #230) → 둘러보기를 고른 비회원으로 홈을 확인한다.
test.beforeEach(async ({ context, baseURL }) => {
  await browseAsGuest(context, baseURL);
});

test("home exposes the main entry links and footer policies", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: "Dayro 홈" })).toBeAttached();
  await expect(
    page.getByRole("link", { name: /데이트 코스 짜러가기/ }),
  ).toHaveAttribute("href", "/course/new/");
  await expect(
    page.getByRole("link", { name: /찜한 코스 보러가기/ }),
  ).toHaveAttribute("href", "/saved/");

  await expect(
    page.getByRole("link", { name: "이용약관" }),
  ).toHaveAttribute("href", "/terms/");
  await expect(
    page.getByRole("link", { name: "개인정보처리방침" }),
  ).toHaveAttribute("href", "/privacy/");
  await expect(page.getByRole("link", { name: "FAQ" })).toHaveAttribute(
    "href",
    "/faq/",
  );
});

/**
 * issue #214 (QA #13): 인앱 브라우저 · 큰 글자처럼 세로가 짧은 화면에서
 * 진입 카드가 헤더 · 푸터에 가려 잘리고, 첫 카드 윗부분은 스크롤로도 볼 수 없었다.
 * 맨 위에서 첫 카드 전체가 보이고, 끝까지 스크롤하면 둘째 카드 전체가 보여야 한다.
 */
test("on a short screen both entry cards can be fully seen by scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 560 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // 비회원 `/` 에는 시작 화면 main 도 숨은 채 함께 있다(issue #244) → 보이는 main
  const main = page.locator("main:visible");
  const cards = main.getByRole("link");
  await expect(cards).toHaveCount(2);

  await main.evaluate((el) => el.scrollTo(0, 0));
  const top = (await main.boundingBox())!;
  const first = (await cards.nth(0).boundingBox())!;
  expect(first.y, "맨 위에서 첫 카드 윗부분이 헤더 밑에 숨으면 안 됩니다.").toBeGreaterThanOrEqual(top.y);

  await main.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const bottom = (await main.boundingBox())!;
  const second = (await cards.nth(1).boundingBox())!;
  expect(second.y + second.height, "끝까지 스크롤하면 둘째 카드가 푸터 밑에 숨으면 안 됩니다.").toBeLessThanOrEqual(
    bottom.y + bottom.height,
  );
});
