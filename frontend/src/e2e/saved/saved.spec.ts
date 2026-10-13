import { expect, test } from "@playwright/test";

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
const savedCourseId = "11111111-1111-4111-8111-111111111111";
const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ request }) => {
  await request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
});

test("guest access to saved redirects to login", async ({ page }) => {
  await page.goto("/saved");

  await expect(page).toHaveURL(/\/login\/?\?next=%2Fsaved$/);
});

test("authenticated user can open saved list and detail", async ({ page, baseURL }) => {
  const base = new URL(baseURL ?? "http://localhost:3000");

  await page.goto(base.origin);
  await page.evaluate((cookieName) => {
    document.cookie = `${cookieName}=mock-access-token; path=/; SameSite=Lax`;
  }, ACCESS_TOKEN_COOKIE_NAME);

  await page.goto("/saved");
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("list", { name: "찜한 코스 목록" })).toBeVisible();
  await expect(page.getByRole("link", { name: /서촌 데이트 코스/ })).toHaveAttribute("href", new RegExp(`/saved/${savedCourseId}/?$`));

  await page.getByRole("link", { name: /서촌 데이트 코스/ }).click();
  await page.waitForLoadState("networkidle");

  await expect(page).toHaveURL(new RegExp(`/saved/${savedCourseId}/?$`));
  await expect(page.getByRole("button", { name: "길안내 공유" })).toBeVisible();
  await expect(page.getByRole("button", { name: "수정완료" })).toBeDisabled();
  await expect(page.getByText("≡ 를 끌어 순서를 바꿔보세요")).toBeVisible();
  await expect(page.getByText("경복궁")).toBeVisible();
  await expect(page.getByText("서촌 카페")).toBeVisible();
});

test("authenticated user can cancel and confirm deleting a saved course", async ({
  page,
  baseURL,
}) => {
  const base = new URL(baseURL ?? "http://localhost:3000");

  await page.goto(base.origin);
  await page.evaluate((cookieName) => {
    document.cookie = `${cookieName}=mock-access-token; path=/; SameSite=Lax`;
  }, ACCESS_TOKEN_COOKIE_NAME);

  await page.goto("/saved");
  await page.waitForLoadState("networkidle");

  const savedCourseLink = page.getByRole("link", {
    name: /서촌 데이트 코스/,
  });
  const deleteButton = page.getByRole("button", {
    name: "서촌 데이트 코스 삭제",
  });

  await deleteButton.click();

  const dialog = page.getByRole("dialog", {
    name: "이 코스를 삭제할까요?",
  });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "취소" }).click();

  await expect(dialog).toBeHidden();
  await expect(savedCourseLink).toBeVisible();

  await deleteButton.click();
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "삭제", exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect(savedCourseLink).toHaveCount(0);
  await expect(deleteButton).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /성수 산책 코스/ }),
  ).toBeVisible();
});
