import { expect, test, type Page } from "@playwright/test";

/**
 * 로그인 시작 응답(state·next 쿠키 포함)은 그대로 받고, 카카오 인가 페이지 대신 같은 state 로
 * 콜백에 바로 돌려보낸다. 리다이렉트 hop 은 가로챌 수 없어 시작 요청 단계에서 처리한다(issue #131).
 * 실수로 외부에 나가지 않도록 카카오 도메인 요청은 모두 차단한다.
 */
async function bypassKakaoAuthorize(page: Page) {
  await page.route(/kakao\.com/, (route) => route.abort());
  await page.route("**/api/auth/kakao/start**", async (route) => {
    // trailingSlash 등 내부 리다이렉트는 따라가고, 카카오로 향하는 응답에서 멈춘다.
    let requestUrl = route.request().url();
    let response = await route.fetch({ url: requestUrl, maxRedirects: 0 });
    let authorizeUrl = new URL(response.headers()["location"] ?? "", requestUrl);
    for (let hop = 0; hop < 5 && authorizeUrl.origin === new URL(requestUrl).origin; hop += 1) {
      if (!response.headers()["location"]) {
        throw new Error("kakao start 응답에 location 이 없습니다.");
      }
      requestUrl = authorizeUrl.toString();
      response = await route.fetch({ url: requestUrl, maxRedirects: 0 });
      authorizeUrl = new URL(response.headers()["location"] ?? "", requestUrl);
    }
    // 테스트 브라우저는 127.0.0.1 로 접속하지만 서버는 redirect_uri 를 localhost 로 만들 수 있어,
    // 쿠키가 같은 host 로 가도록 콜백 주소를 브라우저 origin 으로 맞춘다(운영에서는 같은 도메인).
    const pageOrigin = new URL(route.request().url()).origin;
    const redirectUri = new URL(authorizeUrl.searchParams.get("redirect_uri") ?? "");
    const callbackUrl = new URL(`${redirectUri.pathname}${redirectUri.search}`, pageOrigin);
    callbackUrl.searchParams.set("code", "mock-code");
    callbackUrl.searchParams.set("state", authorizeUrl.searchParams.get("state") ?? "");
    // fulfill 은 여러 Set-Cookie 를 합쳐 버리므로, state·next 쿠키를 브라우저에 직접 넣는다.
    await page.context().addCookies(
      response
        .headersArray()
        .filter((header) => header.name.toLowerCase() === "set-cookie")
        .map((header) => {
          const [pair] = header.value.split(";");
          const separator = pair.indexOf("=");
          return {
            name: pair.slice(0, separator),
            value: pair.slice(separator + 1),
            url: pageOrigin,
            httpOnly: true,
            sameSite: "Lax" as const,
          };
        }),
    );
    await route.fulfill({ status: 302, headers: { location: callbackUrl.toString() } });
  });
}

/**
 * 콜백 응답이 보내는 위치(pathname)를 기다린다.
 * e2e 서버가 자기 origin 을 localhost 로 인식해 127.0.0.1 로 받은 쿠키가 다음 화면에 안 실릴 수 있어,
 * 최종 화면 대신 콜백의 redirect 위치로 복귀 로직을 검증한다(운영에서는 같은 도메인).
 */
function waitForCallbackRedirect(page: Page) {
  return page
    .waitForResponse(
      (response) =>
        /\/api\/auth\/kakao\/callback\/?\?/.test(response.url()) &&
        response.status() >= 300 &&
        response.status() < 400 &&
        !new URL(response.headers()["location"] ?? "/", response.url()).pathname.startsWith(
          "/api/",
        ),
    )
    .then((response) => new URL(response.headers()["location"] ?? "/", response.url()));
}

test("login returns to the protected page that sent the user to login", async ({ page }) => {
  await bypassKakaoAuthorize(page);

  await page.goto("/mypage");
  await expect(page).toHaveURL(/\/login\/?\?next=%2Fmypage$/);

  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();

  expect((await redirect).pathname).toMatch(/^\/mypage\/?$/);
});

test("an external next is ignored and login lands on home", async ({ page }) => {
  await bypassKakaoAuthorize(page);

  await page.goto("/login?next=https%3A%2F%2Fevil.example%2Fphish");
  const redirect = waitForCallbackRedirect(page);
  await page.getByRole("button", { name: "카카오 로그인" }).click();

  const location = await redirect;
  expect(location.pathname).toBe("/");
  expect(location.hostname).not.toBe("evil.example");
});
