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

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

async function fillContact(page: import("@playwright/test").Page, subject: string) {
  await page.goto("/faq/contact");
  await page.waitForLoadState("networkidle");
  await page.getByRole("textbox", { name: "제목" }).fill(subject);
  await page.getByRole("textbox", { name: "내용" }).fill("코스 저장이 안 돼요.");
  await page.getByRole("textbox", { name: "답변받을 이메일" }).fill("hello@example.com");
}

/**
 * issue #224: 문의하기가 실제 문의 API(BE PR#218)로 전달된다.
 * 성공하면 완료 모달, 백엔드는 문의 내용과 접속 IP(X-Forwarded-For)를 받는다.
 */
test("submitting the contact form sends the inquiry to the backend", async ({ page }) => {
  const subject = `e2e 문의 ${Date.now()}`;
  await fillContact(page, subject);
  await page.getByRole("button", { name: "문의 남기기" }).click();
  await expect(page.getByRole("dialog", { name: "문의가 접수됐어요" })).toBeVisible();

  const received = (await (await page.request.get(`http://127.0.0.1:${mockBackendPort}/__mock/inquiries`)).json()) as {
    subject: string;
    email: string;
    forwardedFor: string | null;
  }[];
  const inquiry = received.find((item) => item.subject === subject);
  expect(inquiry, "백엔드가 문의를 받아야 한다").toBeTruthy();
  expect(inquiry?.email).toBe("hello@example.com");
  expect(inquiry?.forwardedFor, "접속 IP 를 함께 넘겨 IP당 제한이 사용자 기준으로 걸린다").toBeTruthy();
});

test("while sending, the button shows progress and cannot be pressed again", async ({ page }) => {
  await fillContact(page, `e2e 진행 ${Date.now()}`);
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/inquiries**", async (route) => {
    await held;
    await route.continue();
  });
  await page.getByRole("button", { name: "문의 남기기" }).click();
  const sending = page.getByRole("button", { name: "보내는 중…" });
  await expect(sending).toBeVisible();
  await expect(sending).toBeDisabled();
  release();
  await expect(page.getByRole("dialog", { name: "문의가 접수됐어요" })).toBeVisible();
});

test("when the backend limits inquiries, the form keeps the input and asks to retry later", async ({ page }) => {
  await fillContact(page, "[429] 빈도 제한");
  await page.getByRole("button", { name: "문의 남기기" }).click();

  // Next 경로 안내(route announcer)도 role=alert 라 문구로 찾는다.
  const limitAlert = page.getByRole("alert").filter({ hasText: "문의가 많아 잠시 후 다시 시도해주세요." });
  await expect(limitAlert).toBeVisible();
  await expect(page.getByRole("dialog", { name: "문의가 접수됐어요" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "제목" })).toHaveValue("[429] 빈도 제한");
  await expect(page.getByRole("button", { name: "문의 남기기" })).toBeEnabled();

  // 고치기 시작하면 안내가 사라진다.
  const subjectInput = page.getByRole("textbox", { name: "제목" });
  await subjectInput.click();
  await subjectInput.press("End");
  await subjectInput.press("Backspace");
  await expect(subjectInput).toHaveValue("[429] 빈도 제");
  await expect(limitAlert).toHaveCount(0);
});
