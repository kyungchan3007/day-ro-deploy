import { expect, test, type Page } from "@playwright/test";

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
const savedCourseId = "11111111-1111-4111-8111-111111111111";
const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";

type ShareMode = "unsupported" | "resolve" | "reject-abort" | "reject-fail";

/**
 * 시스템 공유(navigator.share) 지원 여부 · 결과를 정해 둔다.
 * PC 크롬처럼 지원하지 않거나, 모바일처럼 지원하되 성공 · 취소 · 실패하는 경우를 재현한다.
 */
async function stubSystemShare(page: Page, mode: ShareMode) {
  await page.addInitScript((shareMode) => {
    const calls: unknown[] = [];
    (window as unknown as { __shareCalls: unknown[] }).__shareCalls = calls;
    if (shareMode === "unsupported") {
      Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
      return;
    }
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: (data: unknown) => {
        calls.push(data);
        if (shareMode === "resolve") return Promise.resolve();
        const name = shareMode === "reject-abort" ? "AbortError" : "NotAllowedError";
        return Promise.reject(Object.assign(new Error(name), { name }));
      },
    });
  }, mode);
}

async function openSavedDetail(page: Page, baseURL: string | undefined) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  const base = new URL(baseURL ?? "http://localhost:3000");
  await page.goto(base.origin);
  await page.evaluate((cookieName) => {
    document.cookie = `${cookieName}=mock-access-token; path=/; SameSite=Lax`;
  }, ACCESS_TOKEN_COOKIE_NAME);
  await page.goto(`/saved/${savedCourseId}`);
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "길안내 공유" })).toBeVisible();
}

const shareSheet = (page: Page) => page.getByRole("dialog", { name: "길안내 공유" });

/**
 * issue #183 (QA #19): PC(시스템 공유 미지원 · 실패)에서 "길안내 공유"가 완전 무반응이었다.
 * (QA #12): 공유 방법을 고를 수 없었다. → 공유 방법 시트(링크 복사 · 다른 앱으로 공유).
 */
test("without system share, the share sheet offers link copy and copies the directions link", async ({
  page,
  baseURL,
}) => {
  await stubSystemShare(page, "unsupported");
  await openSavedDetail(page, baseURL);

  await page.getByRole("button", { name: "길안내 공유" }).click();
  await expect(shareSheet(page)).toBeVisible();
  await expect(shareSheet(page).getByRole("button", { name: "링크 복사" })).toBeVisible();
  await expect(shareSheet(page).getByRole("button", { name: "다른 앱으로 공유" })).toHaveCount(0);

  await shareSheet(page).getByRole("button", { name: "링크 복사" }).click();
  await expect(page.getByText("길안내 링크를 복사했어요.")).toBeVisible();
  await expect(shareSheet(page)).toHaveCount(0);
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("/share/course/?");
});

test("with system share, the sheet offers sharing to other apps", async ({ page, baseURL }) => {
  await stubSystemShare(page, "resolve");
  await openSavedDetail(page, baseURL);

  await page.getByRole("button", { name: "길안내 공유" }).click();
  await shareSheet(page).getByRole("button", { name: "다른 앱으로 공유" }).click();
  await expect(page.getByText("길안내 공유를 시작했어요.")).toBeVisible();
  const calls = await page.evaluate(() => (window as unknown as { __shareCalls: { url: string }[] }).__shareCalls);
  expect(calls).toHaveLength(1);
  expect(calls[0].url).toContain("/share/course/?");
});

test("when the system share fails, it copies the link instead of doing nothing", async ({ page, baseURL }) => {
  await stubSystemShare(page, "reject-fail");
  await openSavedDetail(page, baseURL);

  await page.getByRole("button", { name: "길안내 공유" }).click();
  await shareSheet(page).getByRole("button", { name: "다른 앱으로 공유" }).click();
  await expect(page.getByText("공유하지 못해 길안내 링크를 복사했어요.")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("/share/course/?");
});

test("cancelling the system share closes quietly", async ({ page, baseURL }) => {
  await stubSystemShare(page, "reject-abort");
  await openSavedDetail(page, baseURL);

  await page.getByRole("button", { name: "길안내 공유" }).click();
  await shareSheet(page).getByRole("button", { name: "다른 앱으로 공유" }).click();
  await expect(shareSheet(page)).toHaveCount(0);
  await expect(page.getByRole("status").filter({ hasText: /공유|복사/ })).toHaveCount(0);
});

test("the share sheet closes with Escape", async ({ page, baseURL }) => {
  await stubSystemShare(page, "unsupported");
  await openSavedDetail(page, baseURL);

  await page.getByRole("button", { name: "길안내 공유" }).click();
  await expect(shareSheet(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(shareSheet(page)).toHaveCount(0);
});

/**
 * issue #192: 공유 시트 제어를 공용 useSheetDialog 로 옮긴 뒤에도
 * 바깥(백드롭) 클릭으로 닫히고, 포커스가 "길안내 공유" 버튼으로 돌아온다.
 */
test("the share sheet closes with an outside click and focus returns to the share button", async ({
  page,
  baseURL,
}) => {
  await stubSystemShare(page, "unsupported");
  await openSavedDetail(page, baseURL);

  const shareButton = page.getByRole("button", { name: "길안내 공유" });
  await shareButton.click();
  await expect(shareSheet(page)).toBeVisible();

  await page.mouse.click(10, 10);
  await expect(shareSheet(page)).toHaveCount(0);
  await expect(shareButton).toBeFocused();
});
