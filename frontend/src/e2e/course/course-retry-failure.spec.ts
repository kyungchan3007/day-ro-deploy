import { expect, test, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
const RETRY_PATH = /\/api\/situations\/[^/]+\/retry\/?$/;

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/** 상황입력 3단계를 지나 결과 화면까지 이동한다. */
async function goToResult(page: Page) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();

  await page.getByRole("searchbox", { name: "동네 검색" }).fill("서촌");
  const regionOptions = page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();

  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect.poll(() => stepOf(page)).toBe("result");
}

/**
 * issue #143: 다른 코스 보기가 실패하면 보던 결과 화면·후보·남은 횟수를 유지한다.
 * (이전: 목적 단계로 이동 → 새 코스 생성 → 남은 횟수 초기화)
 */
test("a failed retry keeps the current result and remaining count", async ({ page }) => {
  await goToResult(page);

  const firstPlace = page.getByRole("listitem").getByRole("button").first();
  const placeBefore = (await firstPlace.textContent()) ?? "";
  const remainingBefore = await page.getByText(/남은 \d+회/).innerText();

  // 백엔드 Gemini 일시 장애처럼 BFF 가 503 을 돌려주게 한다.
  await page.route(RETRY_PATH, (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "코스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
        data: null,
      }),
    }),
  );
  await page.getByRole("button", { name: "다른 코스 보기" }).click();

  await expect(page.getByText("다른 코스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.")).toBeVisible();
  await expect.poll(() => stepOf(page)).toBe("result");
  await expect(page.getByText(/남은 \d+회/)).toHaveText(remainingBefore);
  await expect(page.getByRole("listitem").getByRole("button").first()).toHaveText(placeBefore);

  // 장애가 풀리면 같은 세션으로 재추천이 이어지고 남은 횟수가 1 줄어든다.
  await page.unroute(RETRY_PATH);
  await page.getByRole("button", { name: "다른 코스 보기" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect.poll(() => stepOf(page)).toBe("result");
  const before = Number(remainingBefore.match(/\d+/)?.[0]);
  await expect(page.getByText(/남은 \d+회/)).toHaveText(`남은 ${before - 1}회`);
});
