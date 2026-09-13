import { expect, test } from "@playwright/test";

test("guest account menu leads to login and mypage redirects unauthenticated users", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("button", { name: "메뉴" }).click();
  await expect(
    page.getByRole("dialog", { name: "계정 메뉴" }),
  ).toBeVisible();

  const loginLink = page.getByRole("link", { name: "로그인" });
  await expect(loginLink).toHaveAttribute("href", "/login/");
  await loginLink.click();

  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(
    page.getByRole("heading", {
      name: "우리에게 맞는\n데이트 코스를 한 번에",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "카카오 로그인" }),
  ).toBeVisible();

  await page.goto("/mypage");
  await expect(page).toHaveURL(/\/login\/?\?next=%2Fmypage$/);
});
