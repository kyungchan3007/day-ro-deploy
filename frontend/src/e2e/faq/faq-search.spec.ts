import { expect, test } from "@playwright/test";

const questions = [
  "Q. 데이로는 어떤 서비스인가요?",
  "Q. 코스 생성은 무료인가요?",
  "Q. 하루에 코스를 몇 번 만들 수 있나요?",
  "Q. 저장한 코스를 수정할 수 있나요?",
  "Q. 로그인 없이도 이용할 수 있나요?",
  "Q. 카카오 로그인 외 다른 방법은 없나요?",
  "Q. 회원탈퇴하면 데이터는 어떻게 되나요?",
] as const;

test.beforeEach(async ({ page }) => {
  await page.goto("/faq");
  await page.waitForLoadState("networkidle");

  const searchInput = page.getByRole("searchbox", { name: "FAQ 검색" });
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeEnabled();
});

test("검색어에 매칭되는 FAQ만 표시한다", async ({ page }) => {
  const searchInput = page.getByRole("searchbox", { name: "FAQ 검색" });

  await searchInput.fill("카카오");

  await expect(
    page.getByRole("button", { name: questions[5], exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: questions[4], exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Q\./ })).toHaveCount(1);
});

test("매칭되는 FAQ가 없으면 빈 상태 안내를 표시한다", async ({ page }) => {
  const searchInput = page.getByRole("searchbox", { name: "FAQ 검색" });

  await searchInput.fill("존재하지않는검색어");

  await expect(page.getByRole("status")).toHaveText(
    "‘존재하지않는검색어’에 대한 검색 결과가 없어요.",
  );
  await expect(page.getByRole("button", { name: /^Q\./ })).toHaveCount(0);
});

test("검색어를 지우면 전체 FAQ 목록을 복원한다", async ({ page }) => {
  const searchInput = page.getByRole("searchbox", { name: "FAQ 검색" });

  await searchInput.fill("카카오");
  await expect(page.getByRole("button", { name: /^Q\./ })).toHaveCount(1);

  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeEnabled();
  await searchInput.clear();

  await expect(page.getByRole("button", { name: /^Q\./ })).toHaveCount(
    questions.length,
  );
  for (const question of questions) {
    await expect(
      page.getByRole("button", { name: question, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("필터 후 순서가 바뀌어도 펼친 FAQ 항목을 안정 키로 유지한다", async ({
  page,
}) => {
  const searchInput = page.getByRole("searchbox", { name: "FAQ 검색" });
  const openedQuestion = page.getByRole("button", {
    name: questions[1],
    exact: true,
  });
  const otherMatchedQuestion = page.getByRole("button", {
    name: questions[2],
    exact: true,
  });

  await expect(openedQuestion).toBeVisible();
  await expect(openedQuestion).toBeEnabled();
  await openedQuestion.click();
  await expect(openedQuestion).toHaveAttribute("aria-expanded", "true");

  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeEnabled();
  await searchInput.fill("코스 생성");

  await expect(page.getByRole("button", { name: /^Q\./ })).toHaveCount(2);
  await expect(openedQuestion).toHaveAttribute("aria-expanded", "true");
  await expect(otherMatchedQuestion).toHaveAttribute("aria-expanded", "false");
});
