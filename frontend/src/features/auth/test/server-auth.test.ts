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
import { GET as meRoute } from "../../../app/api/auth/me/route";
import { proxy } from "../../../proxy";

const authSuccessPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    accessToken: "new-access-token",
    refreshToken: "refresh-token",
    isNewUser: false,
  },
};

const currentMemberPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    provider: "KAKAO",
    nickname: "dayro-user",
    email: "user@example.com",
    name: null,
    profileImage: null,
    birthday: "0727",
    joinedAt: "2026-07-27T10:00:00",
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

  it("me route returns guest session when no auth cookies exist", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/me");

    const response = await meRoute(request);
    const body = await response.json();

    expect(fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(body).toEqual({
      authenticated: false,
      user: null,
    });
  });

  it("me route refreshes the session and returns the current member", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(authSuccessPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentMemberPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const request = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await meRoute(request);
    const body = await response.json();

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL("/api/auth/refresh", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "refresh-token" }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL("/api/auth/me", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer new-access-token",
        },
      }),
    );
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(
      "new-access-token",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe(
      "refresh-token",
    );
    expect(body).toEqual({
      authenticated: true,
      user: currentMemberPayload.data,
    });
  });

  it("me route keeps refreshed cookies when current-member lookup fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(authSuccessPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            message: "회원 정보를 불러오지 못했습니다.",
            data: null,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      );

    const request = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await meRoute(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(
      "new-access-token",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe(
      "refresh-token",
    );
    expect(body).toEqual({
      authenticated: false,
      user: null,
    });
  });

  it("proxy renews the access token on protected routes when only the refresh cookie remains", async () => {
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

    const response = await proxy(request);

    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe(
      "new-access-token",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe(
      "refresh-token",
    );
  });

  it("proxy clears cookies and redirects to login when refresh fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network_error"));

    const request = new NextRequest("http://localhost:3000/saved", {
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
      },
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fsaved",
    );
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value).toBe("");
  });
});
