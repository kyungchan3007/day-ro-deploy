import { expect, test, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/** 이 페이지가 보낸 장소 사진 요청 수(병렬 테스트와 섞이지 않게 페이지 단위로 센다). */
function trackPhotoRequests(page: Page) {
  const urls: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/places/photo") {
      urls.push(request.url());
    }
  });
  return urls;
}

/** 상황입력 → 결과 → 장소 3곳(경복궁 · 국립민속박물관 · 서촌 카페) 선택 → 확정 코스 화면. */
async function goToCourseScreen(page: Page) {
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
  await placeButtons.nth(2).click();
  await page.getByRole("button", { name: "선택완료" }).click();
  await expect.poll(() => stepOf(page)).toBe("course");
}

function placeRow(page: Page, name: string) {
  return page.getByRole("listitem").filter({ has: page.getByText(name, { exact: true }) });
}

/**
 * issue #219 (QA #8): 장소 드롭다운에 사진 · 영업시간이 일부만 보였다.
 *   - 펼치면 사진 → 영업시간 → 주소 → 평점, 사진은 펼칠 때만 요청
 *   - 사진이 없거나 실패하면 기본 이미지, 영업시간이 없으면 "영업시간 정보 없음"
 */
test("a place photo loads only when its row is expanded", async ({ page }) => {
  const photoRequests = trackPhotoRequests(page);
  await goToCourseScreen(page);
  expect(photoRequests, "펼치기 전에는 사진을 요청하지 않는다").toHaveLength(0);

  const row = placeRow(page, "경복궁");
  await row.getByRole("button", { name: "상세보기" }).click();
  const photo = row.getByRole("img", { name: "경복궁 사진" });
  await expect(photo).toBeVisible();
  await expect.poll(() => photo.evaluate((img) => (img as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(row.getByText("매일 09:00-18:00")).toBeVisible();
  expect(photoRequests).toHaveLength(1);
});

test("a place without business hours or photo shows the empty texts", async ({ page }) => {
  await goToCourseScreen(page);
  const row = placeRow(page, "국립민속박물관");
  await row.getByRole("button", { name: "상세보기" }).click();
  await expect(row.getByText("영업시간 정보 없음")).toBeVisible();
  await expect(row.getByRole("img", { name: "사진 없음" })).toBeVisible();
});

test("a photo that fails to load falls back to the default image", async ({ page }) => {
  await goToCourseScreen(page);
  const row = placeRow(page, "서촌 카페");
  await row.getByRole("button", { name: "상세보기" }).click();
  await expect(row.getByRole("img", { name: "사진 없음" })).toBeVisible();
  await expect(row.getByRole("img", { name: "서촌 카페 사진" })).toHaveCount(0);
});
