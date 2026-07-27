import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthTokenCookies,
  readAccessTokenCookie,
  readRefreshTokenCookie,
  refreshBackendAuth,
  setAuthTokenCookies,
} from "./shared/api/server-auth";

/**
 * 인증 route 자체에서는 refresh 재진입을 막는다.
 * @param pathname 현재 요청 경로.
 */
function shouldBypassSessionRefresh(pathname: string) {
  return pathname.startsWith("/api/auth");
}

/**
 * access token 쿠키가 사라졌지만 refresh token 이 남아 있을 때
 * 페이지 진입 시점에 세션을 자동 복구한다.
 * @param request 현재 요청. access/refresh token 쿠키를 읽는다.
 */
export async function middleware(request: NextRequest) {
  if (shouldBypassSessionRefresh(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const accessToken = readAccessTokenCookie(request);
  const refreshToken = readRefreshTokenCookie(request);

  if (accessToken || !refreshToken) {
    return NextResponse.next();
  }

  try {
    const auth = await refreshBackendAuth(refreshToken);
    const response = NextResponse.next();

    setAuthTokenCookies(request, response, {
      accessToken: auth.data.accessToken,
      refreshToken: auth.data.refreshToken,
    });

    return response;
  } catch {
    const response = NextResponse.next();
    clearAuthTokenCookies(request, response);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png).*)"],
};
