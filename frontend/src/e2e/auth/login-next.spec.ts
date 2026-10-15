import { expect, test } from "@playwright/test";

import { bypassKakaoAuthorize, waitForCallbackRedirect } from "../support/kakao-login";

test("login returns to the protected page that sent the user to login", async ({ page }) => {
  await bypassKakaoAuthorize(page);

  await page.goto("/mypage");
  await expect(page).toHaveURL(/\/login\/?\?next=%2Fmypage$/);

  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();

  expect((await redirect).pathname).toMatch(/^\/mypage\/?$/);
});

test("an external next is ignored and login lands on home", async ({ page }) => {
  await bypassKakaoAuthorize(page);

  await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fphish");
  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();

  const location = await redirect;
  expect(location.pathname).toBe("/");
  expect(location.hostname).not.toBe("evil.example");
});
