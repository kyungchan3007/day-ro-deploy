import { expect, test, type Page } from "@playwright/test";

const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
const savedCourseId = "11111111-1111-4111-8111-111111111111";
const mockBackendPort = process.env.MOCK_BACKEND_PORT ?? "18080";
/** 목 백엔드 현재 사용자 닉네임. */
const mockNickname = "테스트 사용자";
const KAKAO_SCRAPER_UA = "facebookexternalhit/1.1; kakaotalk-scrap/1.0; +https://devtalk.kakao.com/";

/** 저장 코스 상세에서 "링크 복사"로 공유 링크를 받는다. */
async function copySavedCourseShareLink(page: Page, baseURL: string | undefined): Promise<string> {
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

  await page.getByRole("button", { name: "길안내 공유" }).click();
  await page.getByRole("dialog", { name: "길안내 공유" }).getByRole("button", { name: "링크 복사" }).click();
  await expect(page.getByText("길안내 링크를 복사했어요.")).toBeVisible();
  return page.evaluate(() => navigator.clipboard.readText());
}

/** `<head>` 안의 meta content 를 property/name 으로 읽는다. */
function readHeadMeta(html: string, key: string): string | null {
  const head = html.split("</head>")[0] ?? "";
  const match = head.match(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`));
  return match ? match[1]!.replace(/&amp;/g, "&") : null;
}

/**
 * issue #187 (QA #5 · #6): 카카오톡 공유 미리보기가 "네이버지도 - 길찾기" · 네이버 이미지로 떴다.
 * → 공유 링크를 데이로 공유 페이지로 바꾸고, 그 페이지 og 메타를 데이로 코스 일정 카드로 채운다.
 */
test("the copied share link is a Dayro share page carrying the nickname and places", async ({
  page,
  baseURL,
}) => {
  const link = await copySavedCourseShareLink(page, baseURL);

  const url = new URL(link);
  expect(url.pathname).toBe("/share/course/");
  expect(url.searchParams.get("n")).toBe(mockNickname);
  expect(url.searchParams.getAll("p").length).toBeGreaterThanOrEqual(2);
  expect(link).not.toContain("map.naver.com");
});

test("the Kakao scraper reads the Dayro course card preview in <head>", async ({ page, baseURL }) => {
  const link = await copySavedCourseShareLink(page, baseURL);

  const response = await page.request.get(link, {
    headers: { "user-agent": KAKAO_SCRAPER_UA },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(200);
  const html = await response.text();

  expect(readHeadMeta(html, "og:title")).toBe("데이로-코스 일정");
  expect(readHeadMeta(html, "og:description")).toBe(`${mockNickname}님의 코스 일정을 확인해 보세요!`);
  expect(readHeadMeta(html, "robots")).toBe("noindex, nofollow");
  const image = readHeadMeta(html, "og:image");
  expect(image).toMatch(/^https?:\/\/[^/]+\/share\/course-preview\.jpg$/);
  expect(image).not.toContain("naver");

  const imageResponse = await page.request.get(image!);
  expect(imageResponse.status()).toBe(200);
  expect(imageResponse.headers()["content-type"]).toContain("image/jpeg");
});

test("opening the share link moves on to Naver directions with every stop", async ({ page, baseURL }) => {
  const link = await copySavedCourseShareLink(page, baseURL);
  await page.route("https://map.naver.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<title>naver stub</title>" }),
  );

  await page.goto(link);
  await page.waitForURL(/^https:\/\/map\.naver\.com\/p\/directions\//);

  const target = page.url();
  const stops = new URL(link).searchParams.getAll("p").map((place) => place.split(",").slice(2).join(","));
  for (const name of stops) {
    expect(target).toContain(encodeURIComponent(name));
  }
  expect(target).toMatch(/\/walk$/);
});

test("a broken share link does not move anywhere and offers the home link", async ({ page }) => {
  let navigatedToNaver = false;
  await page.route("https://map.naver.com/**", (route) => {
    navigatedToNaver = true;
    return route.abort();
  });

  await page.goto("/share/course/?p=https%3A%2F%2Fevil.example");
  await expect(page.getByRole("heading", { name: "공유 링크를 열 수 없어요" })).toBeVisible();
  // 상단 로고 링크도 "데이로 홈으로" 라 본문 영역으로 좁힌다.
  await expect(page.getByRole("main").getByRole("link", { name: "데이로 홈으로" })).toHaveAttribute(
    "href",
    "/",
  );
  expect(navigatedToNaver).toBe(false);
  expect(new URL(page.url()).pathname).toBe("/share/course/");
});
