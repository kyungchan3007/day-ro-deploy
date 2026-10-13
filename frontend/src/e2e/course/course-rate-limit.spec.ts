import { expect, test, type Page, type Route } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
const SITUATIONS_PATH = /\/api\/situations\/?$/;
const RETRY_PATH = /\/api\/situations\/[^/]+\/retry\/?$/;

const RATE_LIMITED = "요청이 너무 많아요. 10초 후 다시 시도해주세요.";
const DAILY_QUOTA = "오늘의 코스 추천 요청 한도를 모두 사용했어요. 내일 다시 이용해주세요.";

/** Cloudflare WAF 속도 제한 차단 응답(JSON 이 아닌 HTML 페이지). */
function fulfillCloudflareBlock(route: Route) {
  return route.fulfill({
    status: 429,
    contentType: "text/html; charset=UTF-8",
    body: "<!DOCTYPE html><html><head><title>Access denied | day-ro.com used Cloudflare to restrict access</title></head><body>Error 1015 You are being rate limited</body></html>",
  });
}

/** BFF 가 전달한 백엔드 429 응답(ApiResponse 형식). */
function fulfillBackend429(route: Route, message: string) {
  return route.fulfill({
    status: 429,
    contentType: "application/json",
    body: JSON.stringify({ success: false, message, data: null }),
  });
}

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/** 상황입력 3단계를 지나 "추천받기!"를 누르기 직전(목적 단계)까지 이동한다. */
async function goToPurpose(page: Page) {
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
}

async function goToResult(page: Page) {
  await goToPurpose(page);
  await page.getByRole("button", { name: "추천받기!" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect.poll(() => stepOf(page)).toBe("result");
}

/** 코스 생성(POST /api/situations/)만 가로챈다. 지역 조회 등 다른 요청은 그대로 보낸다. */
async function interceptGeneration(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(SITUATIONS_PATH, (route) =>
    route.request().method() === "POST" ? handler(route) : route.fallback(),
  );
}

/**
 * issue #161: 429 응답이면 원인에 맞는 문구로 안내한다.
 * - 문구 없는 429(Cloudflare 차단) → 10초 후 재시도 안내
 * - 백엔드 문구가 있는 429 → 그 문구
 * 화면 이동은 기존과 같다(생성 실패 → 목적 단계, 재추천 실패 → 결과 유지).
 */
test("a generation blocked by Cloudflare shows the rate limit notice and returns to purpose", async ({ page }) => {
  await goToPurpose(page);
  await interceptGeneration(page, fulfillCloudflareBlock);

  await page.getByRole("button", { name: "추천받기!" }).click();

  await expect(page.getByText(RATE_LIMITED)).toBeVisible();
  await expect.poll(() => stepOf(page)).toBe("purpose");
  await expect(page.getByText("코스를 만들지 못했어요. 잠시 후 다시 시도해주세요.")).toHaveCount(0);
});

test("a generation hitting the daily quota shows the backend message", async ({ page }) => {
  await goToPurpose(page);
  await interceptGeneration(page, (route) => fulfillBackend429(route, DAILY_QUOTA));

  await page.getByRole("button", { name: "추천받기!" }).click();

  await expect(page.getByText(DAILY_QUOTA)).toBeVisible();
  await expect.poll(() => stepOf(page)).toBe("purpose");
});

test("a retry blocked by Cloudflare keeps the result and remaining count with the rate limit notice", async ({
  page,
}) => {
  await goToResult(page);

  const firstPlace = page.getByRole("listitem").getByRole("button").first();
  const placeBefore = (await firstPlace.textContent()) ?? "";
  const remainingBefore = await page.getByText(/남은 \d+회/).innerText();

  await page.route(RETRY_PATH, fulfillCloudflareBlock);
  await page.getByRole("button", { name: "다른 코스 보기" }).click();

  await expect(page.getByText(RATE_LIMITED)).toBeVisible();
  await expect.poll(() => stepOf(page)).toBe("result");
  await expect(page.getByText(/남은 \d+회/)).toHaveText(remainingBefore);
  await expect(page.getByRole("listitem").getByRole("button").first()).toHaveText(placeBefore);

  // 차단이 풀리면(10초 뒤) 같은 세션으로 재추천이 이어지고 남은 횟수가 1 줄어든다.
  await page.unroute(RETRY_PATH);
  await page.getByRole("button", { name: "다른 코스 보기" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect.poll(() => stepOf(page)).toBe("result");
  const before = Number(remainingBefore.match(/\d+/)?.[0]);
  await expect(page.getByText(/남은 \d+회/)).toHaveText(`남은 ${before - 1}회`);
});

test("a retry rejected by the backend limit shows the backend message", async ({ page }) => {
  await goToResult(page);
  await page.route(RETRY_PATH, (route) => fulfillBackend429(route, "다른 코스 보기를 모두 사용했어요."));

  await page.getByRole("button", { name: "다른 코스 보기" }).click();

  await expect(page.getByText("다른 코스 보기를 모두 사용했어요.")).toBeVisible();
  await expect.poll(() => stepOf(page)).toBe("result");
});
