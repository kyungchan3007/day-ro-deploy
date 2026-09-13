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

async function goToCourseMap(page: import("@playwright/test").Page) {
  await waitForMockBackend(page);
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  const url = new URL("/course/new", "http://127.0.0.1:3000");
  url.searchParams.set("step", "course");
  url.searchParams.set("startMeridiem", "오후");
  url.searchParams.set("startHour", "6");
  url.searchParams.set("startMinute", "0");
  url.searchParams.set("endMeridiem", "오후");
  url.searchParams.set("endHour", "9");
  url.searchParams.set("endMinute", "0");
  url.searchParams.set("districtId", "11011");
  url.searchParams.set("regionLabel", "서촌");
  url.searchParams.set("regionDong", "청운효자동");
  url.searchParams.set("purpose", "date");
  url.searchParams.set("selectedPlaceIds", "place-1,place-2,place-3,place-4");
  await page.goto(`${url.pathname}${url.search}`);

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
