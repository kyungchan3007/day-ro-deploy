import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
}));

vi.mock("@/shared/api/server-auth", async (original) => ({
  ...(await original<typeof import("@/shared/api/server-auth")>()),
  loginWithBackendKakaoCode: mocks.login,
}));

import {
  OAUTH_NEXT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  buildLoginErrorSearchParams,
  sanitizeLoginNextPath,
} from "../model/oauth";
import { GET as startLogin } from "../../../app/api/auth/kakao/start/route";
import { GET as kakaoCallback } from "../../../app/api/auth/kakao/callback/route";

const COURSE_MAP = "/course/new/?step=course&rev=k3x9ab2m";

describe("sanitizeLoginNextPath (issue #131)", () => {
  it.each([
    ["/saved/12", "/saved/12"],
    [COURSE_MAP, COURSE_MAP],
    ["/mypage#section", "/mypage"],
    ["/", "/"],
  ])("allows internal path %s", (input, expected) => {
    expect(sanitizeLoginNextPath(input)).toBe(expected);
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example/phish",
    "/\\evil.example",
    "/\tevil",
    "javascript:alert(1)",
    "saved/12",
    "/login",
    "/login/?next=/saved",
    "/api/auth/logout",
    "/api",
    "/API/auth/logout",
    "/Login",
    "/login;x",
    // 경로 조각 정리 후 `//host` 가 되는 우회(독립 검증 P1)
    "/..//evil.com",
    "/.//evil.com",
    "/a/..//evil.com",
    "/%2e%2e//evil.com",
    "/%2e//evil.com",
    "/%2F%2Fevil.com",
    "/%5c%5cevil.com",
    "",
    `/${"a".repeat(2048)}`,
    undefined,
    42,
  ])("rejects %s", (input) => {
    expect(sanitizeLoginNextPath(input)).toBeNull();
  });

  it("is idempotent for every accepted value", () => {
    for (const input of ["/saved/12", COURSE_MAP, "/mypage#x", "/a/../saved"]) {
      const once = sanitizeLoginNextPath(input);
      expect(once).not.toBeNull();
      expect(sanitizeLoginNextPath(once)).toBe(once);
    }
  });

  it("keeps only a sanitized next in login error search params", () => {
    expect(buildLoginErrorSearchParams({ error: "oauth_cancelled", next: "/saved/1" })).toBe(
      "error=oauth_cancelled&next=%2Fsaved%2F1",
    );
    expect(buildLoginErrorSearchParams({ error: "oauth_cancelled", next: "//evil.example" })).toBe(
      "error=oauth_cancelled",
    );
  });
});

describe("kakao start route keeps next in an httpOnly cookie", () => {
  beforeEach(() => {
    vi.stubEnv("KAKAO_REST_API_KEY", "kakao-client-id");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores a valid next for the OAuth round trip", async () => {
    const url = new URL("http://localhost:3000/api/auth/kakao/start");
    url.searchParams.set("next", COURSE_MAP);

    const response = await startLogin(new NextRequest(url));
    const cookie = response.cookies.get(OAUTH_NEXT_COOKIE_NAME);

    expect(response.headers.get("location")).toContain("https://kauth.kakao.com/oauth/authorize");
    expect(cookie).toMatchObject({ value: COURSE_MAP, httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("clears a previous next when the request carries none or an invalid one", async () => {
    const url = new URL("http://localhost:3000/api/auth/kakao/start");
    url.searchParams.set("next", "https://evil.example");

    const response = await startLogin(new NextRequest(url));

    expect(response.cookies.get(OAUTH_NEXT_COOKIE_NAME)).toMatchObject({ value: "", maxAge: 0 });
  });
});

describe("kakao callback route returns to next", () => {
  beforeEach(() => {
    mocks.login.mockReset();
  });

  function callback(query: string, cookies: Record<string, string>) {
    const request = new NextRequest(`http://localhost:3000/api/auth/kakao/callback?${query}`, {
      headers: {
        cookie: Object.entries(cookies)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join("; "),
      },
    });
    return kakaoCallback(request);
  }

  it("redirects to the stored next after a successful login and clears the cookie", async () => {
    mocks.login.mockResolvedValue({
      data: { accessToken: "a", refreshToken: "r", isNewUser: false },
    });

    const response = await callback("code=c&state=s", {
      [OAUTH_STATE_COOKIE_NAME]: "s",
      [OAUTH_NEXT_COOKIE_NAME]: COURSE_MAP,
    });

    expect(response.headers.get("location")).toBe(`http://localhost:3000${COURSE_MAP}`);
    expect(response.cookies.get(OAUTH_NEXT_COOKIE_NAME)).toMatchObject({ value: "", maxAge: 0 });
  });

  it.each(["//evil.example/phish", "/..//evil.com", "/%2e%2e//evil.com"])(
    "never redirects off-site for a tampered next cookie %s",
    async (tampered) => {
      mocks.login.mockResolvedValue({
        data: { accessToken: "a", refreshToken: "r", isNewUser: false },
      });

      const response = await callback("code=c&state=s", {
        [OAUTH_STATE_COOKIE_NAME]: "s",
        [OAUTH_NEXT_COOKIE_NAME]: tampered,
      });

      expect(response.headers.get("location")).toBe("http://localhost:3000/");
    },
  );

  it("falls back to home when the stored next is tampered", async () => {
    mocks.login.mockResolvedValue({
      data: { accessToken: "a", refreshToken: "r", isNewUser: true },
    });

    const response = await callback("code=c&state=s", {
      [OAUTH_STATE_COOKIE_NAME]: "s",
      [OAUTH_NEXT_COOKIE_NAME]: "//evil.example/phish",
    });

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects backend login failures with an error code only (issue #139 S4)", async () => {
    mocks.login.mockRejectedValue(new Error("internal: token exchange failed at 10.0.0.5"));

    const response = await callback("code=c&state=s", {
      [OAUTH_STATE_COOKIE_NAME]: "s",
      [OAUTH_NEXT_COOKIE_NAME]: "/saved/12",
    });

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("oauth_backend_failed");
    expect(location.searchParams.has("message")).toBe(false);
    expect(location.searchParams.get("next")).toBe("/saved/12");
  });

  it("keeps next on the login error redirect so a retry still returns", async () => {
    const response = await callback("error=access_denied", {
      [OAUTH_STATE_COOKIE_NAME]: "s",
      [OAUTH_NEXT_COOKIE_NAME]: "/saved/12",
    });

    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("error")).toBe("oauth_cancelled");
    expect(location.searchParams.get("next")).toBe("/saved/12");
    expect(response.cookies.get(OAUTH_NEXT_COOKIE_NAME)).toMatchObject({ value: "", maxAge: 0 });
    expect(mocks.login).not.toHaveBeenCalled();
  });
});
