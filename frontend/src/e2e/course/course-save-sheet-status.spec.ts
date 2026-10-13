import { expect, test, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
const COURSES_PATH = /\/api\/courses\/?$/;

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/** 로그인된 저장: 저장 BFF 가 성공 응답을 돌려준다(실제 쿠키 없이 재현). */
async function acceptSave(page: Page) {
  await page.route(COURSES_PATH, async (route) => {
    if (route.request().method() !== "POST") {
      return route.fallback();
    }
    const body = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 200,
      json: {
        success: true,
        message: "요청이 성공했습니다.",
        data: {
          id: "00000000-0000-4000-8000-000000000001",
          title: body.title,
          description: body.description ?? null,
          regionName: "종로구",
          regionCategory: "종로구",
          purpose: body.purpose,
          startTime: body.startTime,
          endTime: body.endTime,
          places: [],
          createdAt: "2026-10-12T00:00:00",
        },
      },
    });
  });
}

/** 상황입력 → 결과 → 장소 2곳 선택 → 확정 코스 화면. */
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
  await page.getByRole("button", { name: "선택완료" }).click();
  await expect.poll(() => stepOf(page)).toBe("course");
}

const saveDialog = (page: Page) => page.getByRole("dialog", { name: "코스 저장하기" });

/**
 * issue #179 (QA #4): 저장 후 "코스 저장하기"를 다시 누르면 바텀시트 안에
 * "코스가 저장되었습니다." 문구가 남아 있었다. 저장 결과는 토스트로만 안내한다.
 */
test("after saving, reopening the save sheet does not show the saved message inside the sheet", async ({
  page,
}) => {
  await acceptSave(page);
  await goToCourseScreen(page);

  await page.getByRole("button", { name: "코스 저장하기" }).click();
  await saveDialog(page).getByLabel(/코스명/).fill("서촌 데이트");
  await saveDialog(page).getByRole("button", { name: "저장하기", exact: true }).click();

  // 저장 결과는 토스트로 안내하고 시트는 닫힌다.
  await expect(page.getByText("코스가 저장되었습니다.")).toBeVisible();
  await expect(saveDialog(page)).toHaveCount(0);

  // 다시 열면 시트 안에 완료 문구가 없다.
  await page.getByRole("button", { name: "코스 저장하기" }).click();
  await expect(saveDialog(page)).toBeVisible();
  await expect(saveDialog(page).getByText("코스가 저장되었습니다.")).toHaveCount(0);
});

test("closing the save sheet clears a previous validation message", async ({ page }) => {
  await goToCourseScreen(page);

  await page.getByRole("button", { name: "코스 저장하기" }).click();
  // 코스명 없이 저장 → 브라우저 기본 안내가 아니라 앱 문구로 안내한다.
  await saveDialog(page).getByRole("button", { name: "저장하기", exact: true }).click();
  await expect(saveDialog(page).getByText("코스명을 입력해주세요")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(saveDialog(page)).toHaveCount(0);

  await page.getByRole("button", { name: "코스 저장하기" }).click();
  await expect(saveDialog(page)).toBeVisible();
  await expect(saveDialog(page).getByText("코스명을 입력해주세요")).toHaveCount(0);
});

test("saving with only spaces in the course name also shows the app message", async ({ page }) => {
  await goToCourseScreen(page);

  await page.getByRole("button", { name: "코스 저장하기" }).click();
  await saveDialog(page).getByLabel(/코스명/).fill("   ");
  await saveDialog(page).getByRole("button", { name: "저장하기", exact: true }).click();
  await expect(saveDialog(page).getByText("코스명을 입력해주세요")).toBeVisible();
});
