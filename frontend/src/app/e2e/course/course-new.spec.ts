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
  await page.getByRole("button", { name: "연남동/홍대입구" }).click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();

  await expect(page.getByText("3/3")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  await expect(page).toHaveURL(/\/course\/new\/?\?step=purpose$/);
});
