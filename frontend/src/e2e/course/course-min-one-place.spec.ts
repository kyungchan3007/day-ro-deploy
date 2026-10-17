import { expect, test, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
const SITUATIONS_PATH = /\/api\/situations\/?$/;

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/**
 * 상황입력 3단계를 지나 결과 화면까지 이동한다.
 * @param placeCount 지정하면 코스 생성 응답의 후보를 이 개수로 줄인다(AI 추천이 적게 온 경우).
 */
async function goToResult(page: Page, placeCount?: number) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  if (placeCount !== undefined) {
    await page.route(SITUATIONS_PATH, async (route) => {
      if (route.request().method() !== "POST") {
        return route.fallback();
      }
      const response = await route.fetch();
      const body = await response.json();
      body.data.places = body.data.places.slice(0, placeCount);
      return route.fulfill({ response, json: body });
    });
  }

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
 * issue #163: AI 추천이 3곳 이하로 와도 결과 화면에서 진행할 수 있어야 한다.
 * (이전: 최소 4곳 선택 조건 → 후보 3곳이면 선택완료 불가)
 */
test("a result with only three places can be confirmed and opens the course map", async ({ page }) => {
  await goToResult(page, 3);

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await expect(placeButtons).toHaveCount(3);

  const confirm = page.getByRole("button", { name: "선택완료" });
  await expect(confirm).toBeDisabled();
  await expect(page.getByText("최소 1곳을 선택해야해요")).toBeVisible();

  for (let index = 0; index < 3; index += 1) {
    await placeButtons.nth(index).click();
  }
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect.poll(() => stepOf(page)).toBe("course");
  await expect(page.getByRole("button", { name: "경로 안내 시작하기" })).toBeVisible();
});

test("a single selected place opens the course map and the route guide explains it needs two places", async ({
  page,
  context,
}) => {
  await goToResult(page);

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await placeButtons.first().click();
  const confirm = page.getByRole("button", { name: "선택완료" });
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect.poll(() => stepOf(page)).toBe("course");

  // 경로 안내는 좌표 2곳 이상일 때만 동작한다(변경 없음). 1곳이면 새 탭 없이 안내만 한다.
  let popupOpened = false;
  context.on("page", () => {
    popupOpened = true;
  });
  await page.getByRole("button", { name: "경로 안내 시작하기" }).click();
  await expect(page.getByText("길 안내를 시작할 장소가 부족해요.")).toBeVisible();
  expect(popupOpened, "1곳이면 네이버 길찾기 새 탭을 열지 않아야 합니다.").toBe(false);
  await expect.poll(() => stepOf(page)).toBe("course");
});
