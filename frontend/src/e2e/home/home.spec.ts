import { expect, test } from "@playwright/test";

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
