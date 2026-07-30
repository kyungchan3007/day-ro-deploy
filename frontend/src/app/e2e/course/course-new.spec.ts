import { expect, test } from "@playwright/test";

test("course creation flow reaches purpose as step 3 of 3", async ({ page }) => {
  await page.goto("/course/new");

  await expect(page.getByText("1/3")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const timeNextButton = page.getByRole("button", {
    name: "다음은 어디서 만날까요?",
  });
  await expect(timeNextButton).toBeEnabled();
  await timeNextButton.click();

  await expect(page.getByText("2/3")).toBeVisible();
  await expect(page).toHaveURL(/\/course\/new\/?\?step=region$/);
  // 지역 목록은 백엔드 기준 데이터라 이름을 고정하지 않고, 실제 렌더된 첫 선택지를 사용한다.
  const regionOptions = page
    .getByRole("radiogroup", { name: "세부 지역 선택" })
    .getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();

  await expect(page.getByText("3/3")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  await expect(page).toHaveURL(/\/course\/new\/?\?step=purpose$/);

  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();

  await expect(page).toHaveURL(/\/course\/new\/?\?step=result$/);
  await expect(page.getByText("AI가 추천한 장소예요")).toBeVisible();
  await expect(page.getByRole("button", { name: "선택완료" })).toBeDisabled();

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await expect(placeButtons.nth(3)).toBeVisible();
  await placeButtons.nth(0).click();
  await placeButtons.nth(1).click();
  await placeButtons.nth(2).click();
  await placeButtons.nth(3).click();

  await expect(page.getByRole("button", { name: "선택완료" })).toBeEnabled();
});
