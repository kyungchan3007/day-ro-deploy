import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { OAUTH_STATE_COOKIE_NAME } from "../model/oauth";
import { GET as startLogin } from "../../../app/api/auth/kakao/start/route";
import UiPreviewLayout from "../../../app/ui-preview/layout";

function start(url: string, headers: Record<string, string> = {}) {
  return startLogin(new NextRequest(url, { headers }));
}

function redirectUriOf(response: Response) {
  return new URL(response.headers.get("location") ?? "").searchParams.get("redirect_uri");
}

describe("auth cookie Secure flag and callback origin (issue #139 S6·S7)", () => {
  beforeEach(() => {
    vi.stubEnv("KAKAO_REST_API_KEY", "kakao-client-id");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("always marks cookies Secure in production even when TLS ends at a proxy", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await start("http://dayro.internal:3000/api/auth/kakao/start");

    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.secure).toBe(true);
  });

  it("honors x-forwarded-proto https outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const response = await start("http://dayro.internal:3000/api/auth/kakao/start", {
      "x-forwarded-proto": "https",
    });

    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.secure).toBe(true);
  });

  it("keeps cookies Secure in production even when a proxy forwards Host: localhost", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_COOKIE_ALLOW_INSECURE", "");

    for (const host of ["localhost:3000", "127.0.0.1:3000"]) {
      const response = await start(`http://${host}/api/auth/kakao/start`);
      expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.secure).toBe(true);
    }
  });

  it("allows http cookies in production only with the explicit server opt-in (e2e start mode)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_COOKIE_ALLOW_INSECURE", "1");

    const response = await start("http://127.0.0.1:3100/api/auth/kakao/start");

    expect(response.cookies.get(OAUTH_STATE_COOKIE_NAME)?.secure).toBe(false);
  });

  it("does not mark cookies Secure for plain http in development (control)", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const plain = await start("http://localhost:3000/api/auth/kakao/start");
    const forwardedHttp = await start("http://localhost:3000/api/auth/kakao/start", {
      "x-forwarded-proto": "http, https",
    });

    expect(plain.cookies.get(OAUTH_STATE_COOKIE_NAME)?.secure).toBe(false);
    expect(forwardedHttp.cookies.get(OAUTH_STATE_COOKIE_NAME)?.secure).toBe(false);
  });

  it("builds the Kakao redirect_uri from APP_ORIGIN when configured", async () => {
    vi.stubEnv("APP_ORIGIN", "https://dayro.example");

    const response = await start("http://10.0.0.5:3000/api/auth/kakao/start");

    expect(redirectUriOf(response)).toBe("https://dayro.example/api/auth/kakao/callback");
  });

  it("ignores a malformed APP_ORIGIN instead of failing the login start", async () => {
    vi.stubEnv("APP_ORIGIN", "dayro.example");

    const response = await start("http://localhost:3000/api/auth/kakao/start");

    expect(response.status).toBe(307);
    expect(redirectUriOf(response)).toBe("http://localhost:3000/api/auth/kakao/callback");
  });

  it("falls back to the request origin without APP_ORIGIN", async () => {
    vi.stubEnv("APP_ORIGIN", "");

    const response = await start("http://localhost:3000/api/auth/kakao/start");

    expect(redirectUriOf(response)).toBe("http://localhost:3000/api/auth/kakao/callback");
  });
});

describe("ui-preview is hidden in production (issue #139 S11·#146)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders not-found for ui-preview routes in production and passes through in development", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => UiPreviewLayout({ children: "preview" })).toThrow();

    vi.stubEnv("NODE_ENV", "development");
    expect(UiPreviewLayout({ children: "preview" })).toBe("preview");
  });
});
