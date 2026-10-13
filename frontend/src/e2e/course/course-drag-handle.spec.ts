import { expect, test, type Locator, type Page } from "@playwright/test";

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
const savedCourseId = "11111111-1111-4111-8111-111111111111";
const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
/** 공용 MenuIcon(햄버거 바 ≡) 경로. */
const HAMBURGER_PATH = "M4 7h16M4 12h16M4 17h16";

/** 손잡이 아이콘이 햄버거 바(≡)이고, 예전 점 6개(⠿) 그립이 아닌지 확인한다. */
async function expectHamburgerHandle(handle: Locator) {
  await expect(handle).toBeVisible();
  await expect(handle.locator("svg path")).toHaveAttribute("d", HAMBURGER_PATH);
  await expect(handle.locator("svg circle")).toHaveCount(0);
}

async function openSavedDetail(page: Page, baseURL: string | undefined) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  const base = new URL(baseURL ?? "http://localhost:3000");
  await page.goto(base.origin);
  await page.evaluate((cookieName) => {
    document.cookie = `${cookieName}=mock-access-token; path=/; SameSite=Lax`;
  }, ACCESS_TOKEN_COOKIE_NAME);
  await page.goto(`/saved/${savedCourseId}`);
  await page.waitForLoadState("networkidle");
}

/**
 * issue #185 (QA #15): 목록 안내 문구는 "≡ 를 끌어…"인데 손잡이는 점 6개(⠿)였다.
 * 코스 화면 · 찜한 코스 상세 모두 햄버거 바(≡) 손잡이로 통일한다.
 */
test("the saved course detail uses hamburger drag handles that match the hint", async ({ page, baseURL }) => {
  await openSavedDetail(page, baseURL);

  await expect(page.getByText("≡ 를 끌어 순서를 바꿔보세요")).toBeVisible();
  const handles = page.getByRole("button", { name: /순서 변경$/ });
  await expect(handles).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    await expectHamburgerHandle(handles.nth(index));
  }
});

test("the course screen after selecting places uses the same hamburger handles", async ({ page }) => {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await page.getByRole("searchbox", { name: "동네 검색" }).fill("서촌");
  await page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio").first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();
  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  const placeButtons = page.getByRole("listitem").getByRole("button");
  await placeButtons.nth(0).click();
  await placeButtons.nth(1).click();
  await page.getByRole("button", { name: "선택완료" }).click();

  await expect(page.getByText("≡ 를 끌어 순서를 바꿔보세요")).toBeVisible();
  await expectHamburgerHandle(page.getByRole("button", { name: /순서 변경$/ }).first());
});

test("the hamburger handle still reorders places with the keyboard", async ({ page, baseURL }) => {
  await openSavedDetail(page, baseURL);
  const firstHandle = page.getByRole("button", { name: "경복궁 순서 변경" });
  await expect(page.getByRole("button", { name: "수정완료" })).toBeDisabled();

  // dnd-kit 키보드 끌기는 키 입력 사이에 위치를 다시 재므로, 단계마다 상태를 기다린다.
  await firstHandle.focus();
  await page.keyboard.press("Space");
  await expect(firstHandle).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await expect(firstHandle).not.toHaveAttribute("aria-pressed", "true");

  // 순서가 바뀌면 첫 손잡이가 다른 장소가 되고 수정완료가 활성화된다.
  await expect(page.getByRole("button", { name: /순서 변경$/ }).first()).not.toHaveAccessibleName("경복궁 순서 변경");
  await expect(page.getByRole("button", { name: "수정완료" })).toBeEnabled();
});
