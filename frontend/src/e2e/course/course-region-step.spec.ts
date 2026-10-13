import { expect, test, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

/**
 * issue #168 (QA #3) 지역 단계 기준:
 *   - 목적 단계까지 갔다가 뒤로 와도 구 · 동네 입력값이 그대로 남고 다음으로 갈 수 있다.
 *   - 동네 검색어를 지우거나, 구를 바꾸거나 `선택 안 함`으로 바꾸면 동네가 초기화되고 다음으로 갈 수 없다.
 */
async function backToRegionStepAfterPurpose(page: Page) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();

  await page.getByRole("searchbox", { name: "동네 검색" }).fill("서촌");
  const regionOptions = page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  const regionNext = page.getByRole("button", { name: /다음은 어떤 만남인가요/ });
  await regionNext.click();
  await expect(page.getByText("3/3")).toBeVisible();

  await page.getByRole("button", { name: "뒤로가기" }).click();
  await expect(page.getByText("2/3")).toBeVisible();
  return { regionNext, regionOptions, regionSearch: page.getByRole("searchbox", { name: "동네 검색" }) };
}

test("going back keeps the district and neighborhood inputs and still allows the next step", async ({ page }) => {
  const { regionNext, regionSearch } = await backToRegionStepAfterPurpose(page);
  // 구 · 동네 입력값이 그대로 남아 있고, 고른 동네가 선택된 채로 보인다.
  await expect(page.getByRole("button", { name: "구 선택" })).toHaveText(/종로구/);
  await expect(regionSearch).toHaveValue("서촌");
  await expect(page.getByRole("radio", { name: /서촌/ })).toHaveAttribute("aria-checked", "true");
  await expect(regionNext).toBeEnabled();
  await regionNext.click();
  await expect(page.getByText("3/3")).toBeVisible();
});

test("changing the district after going back requires picking a neighborhood again", async ({ page }) => {
  const { regionNext, regionOptions } = await backToRegionStepAfterPurpose(page);

  await page.getByRole("button", { name: "구 선택" }).click();
  await page.getByRole("option", { name: "성동구" }).click();
  await expect(regionNext, "다른 구로 바꾸면 이전 동으로 넘어가면 안 됩니다.").toBeDisabled();
  await expect(page.getByRole("searchbox", { name: "동네 검색" }), "구를 바꾸면 동네 검색어도 초기화됩니다.").toHaveValue("");

  // 검색어가 비면 인기 검색어가 보이므로, 새 구의 동네를 검색해 고른다.
  await page.getByRole("searchbox", { name: "동네 검색" }).fill("성수");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  await expect(regionNext).toBeEnabled();
});

test("switching the district to none after going back blocks the next step", async ({ page }) => {
  const { regionNext } = await backToRegionStepAfterPurpose(page);

  await page.getByRole("button", { name: "구 선택" }).click();
  await page.getByRole("option", { name: "선택 안 함" }).click();
  await expect(regionNext, "구를 '선택 안 함'으로 바꾸면 이전 동으로 넘어가면 안 됩니다.").toBeDisabled();
  await expect(page.getByRole("searchbox", { name: "동네 검색" })).toHaveValue("");
});

test("clearing the neighborhood search after going back blocks the next step", async ({ page }) => {
  const { regionNext, regionSearch } = await backToRegionStepAfterPurpose(page);
  await expect(regionNext).toBeEnabled();

  await regionSearch.fill("");
  await expect(regionNext, "동네를 지우면 다음으로 넘어가면 안 됩니다.").toBeDisabled();

  // 다시 검색해 고르면 진행할 수 있다.
  await regionSearch.fill("서촌");
  await page.getByRole("radio", { name: /서촌/ }).click();
  await expect(regionNext).toBeEnabled();
});
