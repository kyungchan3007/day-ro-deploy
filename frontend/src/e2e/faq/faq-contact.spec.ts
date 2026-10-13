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

/** issue #177 (QA #7): 문의하기 화면 상단에 답변 안내 문구를 보여준다(기획안 슬라이드 16). */
test("faq contact shows the reply notice above the form", async ({ page }) => {
  await page.goto("/faq");
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: "문의하기" }).click();
  await expect(page).toHaveURL(/\/faq\/contact\/?$/);

  const notice = page.getByRole("note");
  await expect(notice).toBeVisible();
  await expect(notice).toContainText("1~2주 이내 문의 답변 이메일로 안내드려요.");
  await expect(notice).toContainText("남겨주신 의견은 서비스 개선에 소중히 반영할게요.");

  // 안내 박스는 첫 입력(제목)보다 위에 있다.
  const noticeBox = await notice.boundingBox();
  const subjectBox = await page.getByRole("textbox", { name: "제목" }).boundingBox();
  expect(noticeBox && subjectBox && noticeBox.y + noticeBox.height <= subjectBox.y).toBe(true);
});
