import { expect, test } from "@playwright/test";

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
const EMPTY_SAVED_COURSES_ACCESS_TOKEN = "mock-empty-access-token";

test("authenticated user can start creating a course from the empty saved list", async ({
  page,
  baseURL,
}) => {
  const base = new URL(baseURL ?? "http://localhost:3000");

  await page.goto(base.origin);
  await page.evaluate(
    ({ cookieName, accessToken }) => {
      document.cookie = `${cookieName}=${accessToken}; path=/; SameSite=Lax`;
    },
    {
      cookieName: ACCESS_TOKEN_COOKIE_NAME,
      accessToken: EMPTY_SAVED_COURSES_ACCESS_TOKEN,
    },
  );

  await page.goto("/saved");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("아직 저장한 코스가 없어요")).toBeVisible();
  await expect(
    page.getByText("마음에 드는 코스를 저장하고 여기서 다시 볼 수 있어요"),
  ).toBeVisible();

  const createCourseCta = page.getByRole("button", {
    name: "코스 만들러 가기",
  });
  await expect(createCourseCta).toBeVisible();
  await expect(createCourseCta).toBeEnabled();

  await createCourseCta.click();

  await expect(page).toHaveURL(/\/course\/new\/?$/);
});
