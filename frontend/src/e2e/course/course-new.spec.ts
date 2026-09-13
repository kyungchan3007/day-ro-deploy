import { expect, test } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

test("course creation flow reaches purpose as step 3 of 3", async ({ page }) => {
  function isCourseStepUrl(
    currentUrl: string,
    step: string,
    requiredKeys: string[] = [],
  ): boolean {
    const url = new URL(currentUrl);

    if (url.pathname !== "/course/new/") {
      return false;
    }
    if (url.searchParams.get("step") !== step) {
      return false;
    }

    return requiredKeys.every((key) => Boolean(url.searchParams.get(key)));
  }
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");

  await expect(page.getByText("1/3")).toBeVisible();
  await page.waitForLoadState("networkidle");
  const timeNextButton = page.getByRole("button", {
    name: "다음은 어디서 만날까요?",
  });
  await expect(timeNextButton).toBeEnabled();
  await timeNextButton.click();

  await expect(page.getByText("2/3")).toBeVisible();
  await expect
    .poll(() => page.url())
    .toBeTruthy();
  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "region", [
        "startMeridiem",
        "startHour",
        "startMinute",
        "endMeridiem",
        "endHour",
        "endMinute",
      ]),
    )
    .toBe(true);
  const regionSearch = page.getByRole("searchbox", { name: "동네 검색" });
  await regionSearch.fill("서촌");
  const regionOptions = page
    .getByRole("radiogroup", { name: "동네 선택" })
    .getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();

  await expect(page.getByText("3/3")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "purpose", [
        "startMeridiem",
        "startHour",
        "startMinute",
        "endMeridiem",
        "endHour",
        "endMinute",
        "districtId",
        "regionLabel",
      ]),
    )
    .toBe(true);

  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();

  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "loading", [
        "startMeridiem",
        "startHour",
        "startMinute",
        "endMeridiem",
        "endHour",
        "endMinute",
        "districtId",
        "regionLabel",
        "purpose",
      ]),
    )
    .toBe(true);
  await expect(page.getByText("Dayro에서 데이트 코스를 만들고 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "코스 보러 가기" })).toBeEnabled();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();

  await expect
    .poll(() =>
      isCourseStepUrl(page.url(), "result", [
        "startMeridiem",
        "startHour",
        "startMinute",
        "endMeridiem",
        "endHour",
        "endMinute",
        "districtId",
        "regionLabel",
        "purpose",
        "requestId",
      ]),
    )
    .toBe(true);
  await expect(page.getByText("AI가 추천한 장소예요")).toBeVisible();
  await expect(page.getByRole("button", { name: "선택완료" })).toBeDisabled();
  await expect
    .poll(async () => (await page.getByRole("listitem").count()) >= 4)
    .toBe(true);
  const initialRequestId = new URL(page.url()).searchParams.get("requestId");
  const initialPlaceTexts = await page.getByRole("listitem").allTextContents();

  await page.getByRole("button", { name: "다른 코스 보기" }).click();
  await expect
    .poll(
      () => new URL(page.url()).searchParams.get("step"),
      {
        message: "다른 코스 보기 후 loading 단계로 먼저 이동해야 합니다.",
      },
    )
    .toBe("loading");
  await expect
    .poll(
      () => new URL(page.url()).searchParams.get("requestId"),
      {
        message: "다른 코스 보기 후 loading에서도 requestId는 유지되어야 합니다.",
      },
    )
    .toBe(initialRequestId);
  await expect(page.getByText("Dayro에서 데이트 코스를 만들고 있어요")).toBeVisible();
  await expect(page.getByRole("button", { name: "코스 보러 가기" })).toBeEnabled();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect
    .poll(
      () => new URL(page.url()).searchParams.get("retry"),
      {
        message: "다른 코스 보기 후 일회성 retry 쿼리는 정리되어야 합니다.",
      },
    )
    .toBeNull();
  await expect(
    page.getByRole("button", { name: "다른 코스 보기" }),
  ).toBeEnabled();
  await expect
    .poll(async () => {
      const nextPlaceTexts = await page.getByRole("listitem").allTextContents();
      return JSON.stringify(nextPlaceTexts) !== JSON.stringify(initialPlaceTexts);
    }, {
      message: "다른 코스 보기 후 새로운 추천 결과가 노출되어야 합니다.",
    })
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "다른 코스 보기" }),
  ).toBeEnabled();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const previousPlaces = await page.getByRole("listitem").allTextContents();
    await page.getByRole("button", { name: "다른 코스 보기" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("step"))
      .toBe("loading");
    await page.getByRole("button", { name: "코스 보러 가기" }).click();
    await expect
      .poll(async () => {
        const nextPlaces = await page.getByRole("listitem").allTextContents();
        return JSON.stringify(nextPlaces) !== JSON.stringify(previousPlaces);
      })
      .toBe(true);
  }

  await expect(
    page.getByRole("button", { name: "다른 코스 보기" }),
  ).toBeDisabled();

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await expect
    .poll(async () => await placeButtons.count(), {
      message: "선택 완료 규칙상 재추천 결과는 최소 4개 이상 노출되어야 합니다.",
    })
    .toBeGreaterThanOrEqual(4);
  await placeButtons.nth(0).click();
  await placeButtons.nth(1).click();
  await placeButtons.nth(2).click();
  await placeButtons.nth(3).click();

  await expect(page.getByRole("button", { name: "선택완료" })).toBeEnabled();
});
