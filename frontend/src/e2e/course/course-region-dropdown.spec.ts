import { expect, test, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

/**
 * issue #208 (QA #2): 지역 단계 "② 동네" 검색형 드롭다운(C안).
 *   - 칸을 누르면 드롭다운: 맨 위 인기 검색어 항상, 구를 골랐으면 그 구 동네 전체
 *   - 입력하면 같은 드롭다운에서 좁혀짐
 *   - 고르면 접힘, 고르지 않아도 ▾ · 칸 다시 누르기 · 바깥 누르기 · Esc 로 접힘
 *   - 다른 구의 인기 검색어 · 구 미선택 동네 선택 → 구 자동 변경
 */
async function goToRegionStep(page: Page) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await expect(page.getByText("2/3")).toBeVisible();
}

const regionSearch = (page: Page) => page.getByRole("searchbox", { name: "동네 검색" });
const regionOptions = (page: Page) =>
  page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio");
const popularLabel = (page: Page) => page.getByText("인기 검색어", { exact: true });
const regionNext = (page: Page) => page.getByRole("button", { name: /다음은 어떤 만남인가요/ });

async function chooseDistrict(page: Page, name: string) {
  await page.getByRole("button", { name: "구 선택" }).click();
  await page.getByRole("option", { name }).click();
}

test("after picking a district, opening the neighborhood field lists every neighborhood with popular keywords on top", async ({
  page,
}) => {
  await goToRegionStep(page);
  await chooseDistrict(page, "종로구");

  // 열기 전에는 목록이 없다(드롭다운).
  await expect(regionOptions(page)).toHaveCount(0);
  await regionSearch(page).click();

  await expect(popularLabel(page)).toBeVisible();
  await expect(page.getByText("종로구 동네 2곳")).toBeVisible();
  await expect(regionOptions(page)).toHaveCount(2);

  await page.getByRole("radio", { name: /서촌/ }).click();
  // 고르면 접히고, 칸에는 고른 동네 이름이 들어간다.
  await expect(regionOptions(page)).toHaveCount(0);
  await expect(regionSearch(page)).toHaveValue("서촌");
  await expect(regionNext(page)).toBeEnabled();
});

test("without a district, the dropdown shows popular keywords and a hint, and typing narrows results in place", async ({
  page,
}) => {
  await goToRegionStep(page);
  await regionSearch(page).click();

  await expect(popularLabel(page)).toBeVisible();
  await expect(page.getByText("구를 먼저 고르면 그 구의 동네 전체가 여기 보여요.")).toBeVisible();

  // 실제 입력처럼 한 글자씩 친다.
  await regionSearch(page).pressSequentially("성수");
  await expect(popularLabel(page), "입력 중에도 인기 검색어는 항상 보인다.").toBeVisible();
  await expect(regionOptions(page)).toHaveCount(1);
  await expect(regionOptions(page).first()).toContainText("성동구");

  await regionOptions(page).first().click();
  // 구를 고르지 않았으면 고른 동네의 구로 맞춰진다.
  await expect(page.getByRole("button", { name: "구 선택" })).toHaveText(/성동구/);
  await expect(regionNext(page)).toBeEnabled();
});

test("a popular keyword from another district switches the district automatically", async ({ page }) => {
  await goToRegionStep(page);
  await chooseDistrict(page, "종로구");
  await regionSearch(page).click();

  await page.getByRole("button", { name: "성수", exact: true }).click();
  await expect(page.getByRole("button", { name: "구 선택" })).toHaveText(/성동구/);
  await expect(regionSearch(page)).toHaveValue("성수");
  await expect(regionOptions(page)).toHaveCount(0);
  await expect(regionNext(page)).toBeEnabled();
});

test("the dropdown folds without a selection: chevron, tapping the field again, outside tap, and Escape", async ({
  page,
}) => {
  await goToRegionStep(page);
  await chooseDistrict(page, "종로구");
  const field = regionSearch(page);

  // ① ▾ 버튼
  await page.getByRole("button", { name: "동네 목록 펼치기" }).click();
  await expect(regionOptions(page)).toHaveCount(2);
  await page.getByRole("button", { name: "동네 목록 접기" }).click();
  await expect(regionOptions(page)).toHaveCount(0);

  // ② 칸 다시 누르기
  await field.click();
  await expect(regionOptions(page)).toHaveCount(2);
  await field.click();
  await expect(regionOptions(page)).toHaveCount(0);

  // ③ 바깥 누르기
  await field.click();
  await expect(regionOptions(page)).toHaveCount(2);
  await page.getByRole("heading", { name: /어디로 갈까요/ }).click();
  await expect(regionOptions(page)).toHaveCount(0);

  // ④ Esc
  await field.click();
  await expect(regionOptions(page)).toHaveCount(2);
  await page.keyboard.press("Escape");
  await expect(regionOptions(page)).toHaveCount(0);

  // 고르지 않고 접었으니 다음으로 갈 수 없다.
  await expect(regionNext(page)).toBeDisabled();
});

test("editing the picked neighborhood text clears the selection", async ({ page }) => {
  await goToRegionStep(page);
  await chooseDistrict(page, "종로구");
  await regionSearch(page).click();
  await page.getByRole("radio", { name: /서촌/ }).click();
  await expect(regionNext(page)).toBeEnabled();

  await regionSearch(page).click();
  await page.keyboard.press("End");
  await page.keyboard.press("Backspace");
  await expect(regionNext(page), "칸 글자가 고른 동네와 달라지면 다음으로 갈 수 없다.").toBeDisabled();
});
