import { expect, test, type Locator, type Page } from "@playwright/test";

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
const savedCourseId = "11111111-1111-4111-8111-111111111111";
const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

test.use({ viewport: { width: 375, height: 812 } });

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("element has no box");
  return rect;
}

/** 토스트가 헤더 바로 아래 상단에 있고, 하단 CTA 와 겹치지 않는다. */
async function expectToastAtTop(page: Page, toast: Locator, cta: Locator) {
  const header = await box(page.getByRole("banner"));
  const toastBox = await box(toast);
  const ctaBox = await box(cta);
  expect(toastBox.y, "토스트는 헤더 아래에서 시작한다").toBeGreaterThanOrEqual(header.y + header.height);
  expect(toastBox.y, "토스트는 화면 상단 영역에 뜬다").toBeLessThan(140);
  expect(toastBox.y + toastBox.height, "토스트가 하단 CTA 를 가리지 않는다").toBeLessThan(ctaBox.y);
}

/**
 * issue #194: 토스트가 화면마다 하단 위치가 달랐고, 상황 입력 · 결과 화면에서는 하단 메인 CTA 를 가렸다.
 * 전 화면 토스트를 헤더 아래 상단 한 곳에 띄운다.
 */
test("the situation step guide toast shows below the header, not over the bottom CTA", async ({ page }) => {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.goto("/course/new");
  const guide = page.getByRole("status").filter({ hasText: "순으로 추천해드려요" });
  await expect(guide).toBeVisible();
  await expectToastAtTop(page, guide, page.getByRole("button", { name: "다음은 어디서 만날까요?" }));
});

test("the saved course share toast shows below the header, not over the bottom CTA", async ({
  page,
  baseURL,
}) => {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });
  const base = new URL(baseURL ?? "http://localhost:3000");
  await page.goto(base.origin);
  await page.evaluate((cookieName) => {
    document.cookie = `${cookieName}=mock-access-token; path=/; SameSite=Lax`;
  }, ACCESS_TOKEN_COOKIE_NAME);
  await page.goto(`/saved/${savedCourseId}`);
  await page.waitForLoadState("networkidle");

  const shareButton = page.getByRole("button", { name: "길안내 공유" });
  await shareButton.click();
  await page.getByRole("dialog", { name: "길안내 공유" }).getByRole("button", { name: "링크 복사" }).click();
  const toast = page.getByRole("status").filter({ hasText: "길안내 링크를 복사했어요." });
  await expect(toast).toBeVisible();
  await expectToastAtTop(page, toast, shareButton);
});

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
  await expect.poll(() => new URL(page.url()).searchParams.get("step")).toBe("course");
}

test("the course save toast shows below the header, not over the bottom CTAs", async ({ page }) => {
  // 로그인된 저장: 저장 BFF 가 성공 응답을 돌려준다(실제 쿠키 없이 재현).
  await page.route(/\/api\/courses\/?$/, async (route) => {
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
          createdAt: "2026-10-13T00:00:00",
        },
      },
    });
  });
  await goToCourseScreen(page);

  const saveButton = page.getByRole("button", { name: "코스 저장하기" });
  await saveButton.click();
  const dialog = page.getByRole("dialog", { name: "코스 저장하기" });
  await dialog.getByRole("textbox", { name: /코스명/ }).fill("서촌 데이트");
  await dialog.getByRole("button", { name: "저장하기", exact: true }).click();

  const toast = page.getByRole("status").filter({ hasText: "코스가 저장되었습니다." });
  await expect(toast).toBeVisible();
  await expectToastAtTop(page, toast, saveButton);
});
