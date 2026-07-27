import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../model/oauth";
import {
  clearAuthTokenCookies,
  readAccessTokenCookie,
  readRefreshTokenCookie,
  setAuthTokenCookies,
} from "../../../shared/api/server-auth";
import { POST as refreshRoute } from "../../../app/api/auth/refresh/route";
import { DELETE as logoutRoute } from "../../../app/api/auth/logout/route";
import { middleware } from "../../../middleware";

const authSuccessPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    accessToken: "new-access-token",
    refreshToken: "refresh-token",
    isNewUser: false,
  },
};

describe("Server auth", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("stores and clears auth cookies on server responses", () => {
    const request = new NextRequest("http://localhost:3000/login");
    const response = NextResponse.next();

    setAuthTokenCookies(request, response, {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(
      "access-token",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe(
      "refresh-token",
    );

    clearAuthTokenCookies(request, response);

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe("");
  });

  it("reads auth cookies from incoming requests", () => {
    const request = new NextRequest("http://localhost:3000", {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token; ${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    expect(readAccessTokenCookie(request)).toBe("access-token");
    expect(readRefreshTokenCookie(request)).toBe("refresh-token");
  });

  it("refresh route renews auth cookies from the refresh token cookie", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(authSuccessPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await refreshRoute(request);
    const body = await response.json();

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/auth/refresh", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-token" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(
      "new-access-token",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe(
      "refresh-token",
    );
    expect(body).toEqual(authSuccessPayload);
  });

  it("logout route clears local cookies even if backend logout fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network_error"));

    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "DELETE",
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token; ${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await logoutRoute(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe("");
    expect(body).toEqual({
      success: true,
      message: "로그아웃 되었습니다.",
      data: null,
    });
  });

  it("middleware renews the access token when only the refresh cookie remains", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(authSuccessPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const request = new NextRequest("http://localhost:3000/mypage", {
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await middleware(request);

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(
      "new-access-token",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe(
      "refresh-token",
    );
  });
});
