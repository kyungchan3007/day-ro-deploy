import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
const COURSES_PATH = /\/api\/courses\/?$/;

function stepOf(page: Page) {
  return new URL(page.url()).searchParams.get("step");
}

/** 비로그인 저장: BFF 가 401 을 돌려준다(실제 쿠키 없이 재현). */
async function rejectSaveAsLoggedOut(target: Page | BrowserContext) {
  await target.route(COURSES_PATH, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 401,
          json: { success: false, message: "로그인이 필요합니다.", data: null },
        })
      : route.fallback(),
  );
}

/** 로그인 후 저장: 요청 본문을 받아 저장 성공 응답을 돌려주고, 받은 본문을 기록한다. */
async function acceptSaveAsLoggedIn(page: Page, received: unknown[]) {
  await page.route(COURSES_PATH, async (route) => {
    if (route.request().method() !== "POST") {
      return route.fallback();
    }
    const body = route.request().postDataJSON() as Record<string, unknown>;
    received.push(body);
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

/** 상황입력 → 결과 → 장소 2곳 선택 → 확정 코스 화면 → 저장 시트 제출(비로그인 → 로그인 화면). */
async function submitSaveWhileLoggedOut(page: Page) {
  await page.request.post(`http://127.0.0.1:${mockBackendPort}/__mock/reset`);
  await rejectSaveAsLoggedOut(page);
  await page.goto("/course/new");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "다음은 어디서 만날까요?" }).click();
  await page.getByRole("searchbox", { name: "동네 검색" }).fill("서촌");
  await page.getByRole("radiogroup", { name: "동네 선택" }).getByRole("radio").first().click();
  await page.getByRole("button", { name: /다음은 어떤 만남인가요/ }).click();
  await page.getByRole("radio", { name: "데이트" }).click();
  await page.getByRole("button", { name: "추천받기!" }).click();
  await page.getByRole("button", { name: "코스 보러 가기" }).click();
  await expect.poll(() => stepOf(page)).toBe("result");

  const placeButtons = page.getByRole("listitem").getByRole("button");
  await placeButtons.nth(0).click();
  await placeButtons.nth(1).click();
  await page.getByRole("button", { name: "선택완료" }).click();
  await expect.poll(() => stepOf(page)).toBe("course");
  const courseUrl = page.url();

  await page.getByRole("button", { name: "코스 저장하기" }).click();
  await page.getByLabel(/코스명/).fill("서촌 데이트");
  await page.getByLabel("한 줄 설명").fill("고궁 산책");
  await page.getByRole("button", { name: "저장하기", exact: true }).click();

  await expect(page).toHaveURL(/\/login\/?\?next=/);
  const next = new URL(page.url()).searchParams.get("next");
  expect(next, "로그인 후 코스 화면으로 돌아올 주소").toBe(
    new URL(courseUrl).pathname + new URL(courseUrl).search,
  );
  return next!;
}

/**
 * issue #169 (QA #11): 코스 저장 중 카카오 로그인·회원가입을 하면
 * 상황입력 1단계로 가며 입력이 사라졌다. 모바일 로그인은 새 탭으로 돌아올 수 있다.
 */
test("returning in a new tab after login restores the course screen and finishes the save", async ({
  page,
  context,
}) => {
  const next = await submitSaveWhileLoggedOut(page);

  // 로그인·회원가입 후 새 탭으로 돌아온 상황: 같은 브라우저(localStorage 공유) · 새 탭(sessionStorage 없음)
  const returned = await context.newPage();
  const received: unknown[] = [];
  await acceptSaveAsLoggedIn(returned, received);
  await returned.goto(next);

  await expect.poll(() => stepOf(returned), { message: "1단계(time)로 가면 안 됩니다." }).toBe("course");
  await expect(returned.getByRole("button", { name: "경로 안내 시작하기" })).toBeVisible();
  await expect(returned.getByText("코스가 저장되었습니다.")).toBeVisible();
  expect(received).toHaveLength(1);
  expect(received[0]).toMatchObject({ title: "서촌 데이트", description: "고궁 산책" });
  expect((received[0] as { places: unknown[] }).places).toHaveLength(2);

  // 한 번 저장하면 새로고침해도 다시 저장하지 않는다.
  await returned.reload();
  await expect.poll(() => stepOf(returned)).toBe("course");
  await expect(returned.getByRole("button", { name: "경로 안내 시작하기" })).toBeVisible();
  expect(received).toHaveLength(1);
});

test("returning in the same tab after login finishes the save", async ({ page }) => {
  const next = await submitSaveWhileLoggedOut(page);

  await page.unroute(COURSES_PATH);
  const received: unknown[] = [];
  await acceptSaveAsLoggedIn(page, received);
  await page.goto(next);

  await expect.poll(() => stepOf(page)).toBe("course");
  await expect(page.getByText("코스가 저장되었습니다.")).toBeVisible();
  expect(received).toHaveLength(1);
});

test("if the save is still unauthorized after returning, it explains instead of sending to login again", async ({
  page,
  context,
}) => {
  const next = await submitSaveWhileLoggedOut(page);

  // 로그인을 끝내지 못하고 돌아온 상황: 저장이 여전히 401
  const returned = await context.newPage();
  await rejectSaveAsLoggedOut(returned);
  await returned.goto(next);

  await expect.poll(() => stepOf(returned)).toBe("course");
  await expect(returned.getByText("로그인 후 다시 저장해주세요.")).toBeVisible();
  // 로그인 화면으로 다시 보내지 않는다(왕복 반복 방지).
  await expect.poll(() => new URL(returned.url()).pathname).toMatch(/^\/course\/new\/?$/);
});
