import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../features/auth/model/oauth";
import type { AuthSession } from "../../features/auth/model/session";
import {
  clearAuthTokenCookies,
  readAccessTokenCookie,
  readRefreshTokenCookie,
  setAuthTokenCookies,
} from "./server-auth-cookies";
import {
  fetchBackendCurrentUser,
  refreshBackendAuth,
} from "./server-auth-client";

const guestSession: AuthSession = {
  authenticated: false,
  user: null,
};

/**
 * Next Route Handler 요청에서 현재 세션을 해석한다.
 *
 * access token 이 없거나 만료됐더라도 refresh token 이 남아 있으면
 * 재발급 후 사용자 정보를 다시 조회하고, 새 쿠키를 응답에 기록한다.
 *
 * @param request 현재 Route Handler 요청.
 * @param response 세션 쿠키를 기록할 응답.
 */
export async function resolveAuthSessionFromRequest(
  request: NextRequest,
  response: NextResponse,
): Promise<AuthSession> {
  const accessToken = readAccessTokenCookie(request);
  const refreshToken = readRefreshTokenCookie(request);

  const loadCurrentUser = async (token: string) => {
    const user = await fetchBackendCurrentUser(token);
    return {
      authenticated: true,
      user,
    } satisfies AuthSession;
  };

  if (accessToken) {
    try {
      return await loadCurrentUser(accessToken);
    } catch {
      if (!refreshToken) {
        clearAuthTokenCookies(request, response);
        return guestSession;
      }
    }
  }

  if (!refreshToken) {
    return guestSession;
  }

  try {
    const refreshedAuth = await refreshBackendAuth(refreshToken);

    setAuthTokenCookies(request, response, {
      accessToken: refreshedAuth.data.accessToken,
      refreshToken: refreshedAuth.data.refreshToken,
    });

    return await loadCurrentUser(refreshedAuth.data.accessToken);
  } catch {
    clearAuthTokenCookies(request, response);
    return guestSession;
  }
}

/**
 * Server Component 에서 현재 세션을 읽는다.
 *
 * 보호 라우트는 proxy 가 먼저 refresh 를 처리하므로 여기서는
 * access token 으로 사용자 정보만 조회하고, 실패하면 비로그인으로 본다.
 */
export async function resolveAuthSessionForServerComponent(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null;

  if (!accessToken) {
    return guestSession;
  }

  try {
    const user = await fetchBackendCurrentUser(accessToken);
    return {
      authenticated: true,
      user,
    };
  } catch {
    return guestSession;
  }
}
