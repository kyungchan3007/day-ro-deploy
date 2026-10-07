import { expect, test } from "@playwright/test";

test("faq contact flow opens from faq and returns after confirmation", async ({
  page,
}) => {
  await page.goto("/faq");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: "문의하기" }).click();

  await expect(page).toHaveURL(/\/faq\/contact\/?$/);
  await expect(
    page.getByRole("navigation", { name: "상단 탐색" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: "제목" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "내용" })).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "답변받을 이메일" }),
  ).toBeVisible();

  const submitButton = page.getByRole("button", { name: "문의 남기기" });
  await expect(submitButton).toBeDisabled();

  await page.getByRole("textbox", { name: "제목" }).fill("문의 제목");
  await page.getByRole("textbox", { name: "내용" }).fill("문의 내용");
  await page
    .getByRole("textbox", { name: "답변받을 이메일" })
    .fill("hello@example.com");

  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  await expect(
    page.getByRole("dialog", { name: "문의가 접수됐어요" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "확인" }).click();

  await expect(page).toHaveURL(/\/faq\/?$/);
  await expect(page.getByRole("heading", { name: "자주 묻는 질문" })).toBeVisible();
});
