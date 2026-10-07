import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "./auth-cookies";
import type { AuthSession, SessionUser } from "./auth-session";
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
import { isBackendAuthRejection } from "./backend-error";
import { buildLoginRedirectPath, buildSessionRestorePath } from "../lib/login-redirect";

const guestSession: AuthSession = {
  authenticated: false,
  user: null,
};

/**
 * Next Route Handler 요청에서 현재 세션을 해석한다.
 *
 * access token 이 없거나 만료됐더라도 refresh token 이 남아 있으면
 * 재발급 후 사용자 정보를 다시 조회하고, 새 쿠키를 응답에 기록한다.
 * 단, 현재 사용자 조회(`/me`) 실패만으로 세션 쿠키를 바로 제거하지는 않는다.
 * 프로필 조회 실패와 토큰 만료를 구분해, refresh 자체가 실패할 때만 쿠키를 정리한다.
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
    } catch (error) {
      // 토큰 거절(만료 등)일 때만 refresh 로 넘어간다. 백엔드 장애면 쿠키를 건드리지 않고 이번 요청만 비로그인으로 본다.
      if (!isBackendAuthRejection(error)) {
        console.error("[BFF] 현재 사용자 조회 실패(세션 유지)", error);
        return guestSession;
      }
      if (!refreshToken) {
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

    try {
      return await loadCurrentUser(refreshedAuth.data.accessToken);
    } catch {
      return guestSession;
    }
  } catch (error) {
    // refresh token 이 거절됐을 때만 쿠키를 지운다. 장애·설정 누락(BACKEND_API_BASE_URL 등)은 로그만 남기고 유지한다(issue #139 S8·S10).
    if (isBackendAuthRejection(error)) {
      clearAuthTokenCookies(request, response);
    } else {
      console.error("[BFF] 세션 refresh 실패(세션 유지)", error);
    }
    return guestSession;
  }
}

/**
 * Server Component 에서 현재 세션을 읽는다.
 *
 * Server Component 는 쿠키를 쓸 수 없어 refresh 를 하지 않는다.
 * access token 으로 사용자 정보만 조회하고, 실패하면 비로그인으로 본다.
 * 보호 화면은 `requireAuthSessionForServerComponent`를 써서 refresh 경로를 거친다.
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

/**
 * 보호 화면(Server Component)의 인증 가드(issue #146, 이전 `proxy.ts` 역할).
 *
 * - access token 없이 refresh token 만 남아 있으면 세션 복구 Route Handler 로 보낸다.
 *   Route Handler 가 refresh 후 새 쿠키를 심고 `nextPath`로 되돌려 보낸다.
 * - 그 밖에 세션이 없으면 로그인으로 보낸다.
 * 복구 뒤에는 access token 이 생기므로 다시 복구 경로로 가지 않는다(무한 리다이렉트 없음).
 * @param nextPath 복구·로그인 후 돌아올 내부 경로.
 * @returns 로그인 사용자 세션.
 */
export async function requireAuthSessionForServerComponent(
  nextPath: string,
): Promise<AuthSession & { authenticated: true; user: SessionUser }> {
  const cookieStore = await cookies();
  const hasAccessToken = Boolean(cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value);
  const hasRefreshToken = Boolean(cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value);

  if (!hasAccessToken && hasRefreshToken) {
    redirect(buildSessionRestorePath(nextPath));
  }

  const session = await resolveAuthSessionForServerComponent();

  if (!session.authenticated || !session.user) {
    redirect(buildLoginRedirectPath(nextPath));
  }

  return { authenticated: true, user: session.user };
}
