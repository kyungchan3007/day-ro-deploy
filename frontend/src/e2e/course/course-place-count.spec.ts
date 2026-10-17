import { expect, test, type Page } from "@playwright/test";

/**
 * issue #247 (QA #9): 상황입력 시간 스텝 장소 수 스테퍼.
 * 2~5곳 · 기본 3곳, 뒤로 와도 고른 값 유지, 코스 생성 요청에는 아직 보내지 않는다(백엔드 필드 추가 전).
 */
const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

const placeValue = (page: Page) =>
  page.getByRole("region", { name: "몇 군데를 돌아볼까요?" }).getByRole("status");
const minus = (page: Page) => page.getByRole("button", { name: "줄이기" });
const plus = (page: Page) => page.getByRole("button", { name: "늘리기" });

async function openTimeStep(page: Page) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  await expect(page.getByText("1/3")).toBeVisible();
  await page.waitForLoadState("networkidle");
}

test("the time step lets you pick 2 to 5 places, starting at 3", async ({ page }) => {
  await openTimeStep(page);
  await expect(page.getByRole("heading", { name: "몇 군데를 돌아볼까요?" })).toBeVisible();
  await expect(page.getByText("여유롭게, 혹은 알차게 정해보세요")).toBeVisible();
  await expect(placeValue(page)).toHaveText("장소 3곳");

  await plus(page).click();
  await plus(page).click();
  await expect(placeValue(page)).toHaveText("장소 5곳");
  await expect(plus(page)).toBeDisabled();

  for (let i = 0; i < 3; i += 1) await minus(page).click();
  await expect(placeValue(page)).toHaveText("장소 2곳");
  await expect(minus(page)).toBeDisabled();
  await expect(plus(page)).toBeEnabled();
});

test("the chosen place count is kept when coming back and after reload", async ({ page }) => {
  await openTimeStep(page);
  await plus(page).click();
  await expect(placeValue(page)).toHaveText("장소 4곳");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await expect(page.getByText("2/3")).toBeVisible();

  // 화면의 뒤로가기(지역 → 시간). 브라우저 뒤로는 그 시점 스냅샷을 그대로 복원하는 설계(issue #129)라 시간 입력과 같은 방식으로 확인한다.
  await page.getByRole("button", { name: "뒤로가기" }).click();
  await expect(page.getByText("1/3")).toBeVisible();
  await expect(placeValue(page)).toHaveText("장소 4곳");

  await page.reload();
  await expect(page.getByText("1/3")).toBeVisible();
  await expect(placeValue(page)).toHaveText("장소 4곳");
});

test("the course request does not send the place count yet", async ({ page }) => {
  await openTimeStep(page);
  await plus(page).click();
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await expect(page.getByText("2/3")).toBeVisible();
  const regionSearch = page.getByRole("searchbox", { name: "동네 검색" });
  await regionSearch.fill("서촌");
  await page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio").first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();
  await expect(page.getByText("3/3")).toBeVisible();
  await page.getByRole("radio", { name: "데이트" }).click();

  const request = page.waitForRequest((req) => req.url().includes("/api/situations") && req.method() === "POST");
  await page.getByRole("button", { name: "추천받기!" }).click();
  const body = (await request).postDataJSON();
  expect(Object.keys(body).sort()).toEqual(["districtId", "endTime", "purpose", "startTime"]);
});
