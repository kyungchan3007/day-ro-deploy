import { expect, test } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

async function waitForMockBackend(page: import("@playwright/test").Page) {
  await expect
    .poll(
      async () => {
        try {
          const response = await page.request.get(
            `http://127.0.0.1:${mockBackendPort}/__mock/stats`,
          );
          return response.ok();
        } catch {
          return false;
        }
      },
      { timeout: 10_000, message: "mock backend should be reachable" },
    )
    .toBe(true);
}

// issue #129: 코스 상태는 주소가 아니라 흐름 상태에 있으므로, 실제 사용자 흐름으로 코스 화면까지 이동한다.
async function goToCourseMap(page: import("@playwright/test").Page) {
  await waitForMockBackend(page);
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");

  await expect(page.getByText("1/3")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();

  await expect(page.getByText("2/3")).toBeVisible();
  await page.getByRole("searchbox", { name: "동네 검색" }).fill("서촌");
  const regionOptions = page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio");
  await expect(regionOptions.first()).toBeVisible();
  await regionOptions.first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();

  await expect(page.getByText("3/3")).toBeVisible();
  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();

  const viewCourseButton = page.getByRole("button", { name: "코스 보러 가기" });
  await expect(viewCourseButton).toBeEnabled();
  await viewCourseButton.click();

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await expect.poll(async () => await placeButtons.count()).toBeGreaterThanOrEqual(4);
  for (let index = 0; index < 4; index += 1) {
    await placeButtons.nth(index).click();
  }
  await page.getByRole("button", { name: "선택완료" }).click();

  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("course");
  await expect(page.getByRole("button", { name: "경로 안내 시작하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "경로 안내 시작하기" })).toBeEnabled();
}

test("route guide opens naver directions in a new tab and keeps the course screen open", async ({
  page,
  context,
}) => {
  await goToCourseMap(page);

  const popupPromise = context.waitForEvent("page");
  await page.getByRole("button", { name: "경로 안내 시작하기" }).click();
  const popup = await popupPromise;

  await expect
    .poll(() => popup.url(), {
      message: "네이버 길찾기 새 탭이 열려야 합니다.",
    })
    .toContain("https://map.naver.com/p/directions/");
  await expect
    .poll(() => popup.url())
    .toContain("/walk");

  await expect
    .poll(() => new URL(page.url()).searchParams.get("step"))
    .toBe("course");
  await expect(page.getByRole("button", { name: "경로 안내 시작하기" })).toBeVisible();

  await popup.close();
});
