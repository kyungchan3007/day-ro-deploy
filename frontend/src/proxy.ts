import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthTokenCookies,
  readAccessTokenCookie,
  readRefreshTokenCookie,
  refreshBackendAuth,
  setAuthTokenCookies,
} from "./shared/api/server-auth";

/**
 * 세션 복구에 실패했을 때 로그인 화면으로 돌려보낼 URL을 만든다.
 * 원래 가려던 경로를 `next` 쿼리로 보존해 로그인 후 복귀 정책을 붙일 수 있게 한다.
 * @param request 현재 보호 경로 요청.
 */
function buildLoginRedirectUrl(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return loginUrl;
}

/**
 * access token 쿠키가 사라졌지만 refresh token 이 남아 있을 때
 * 보호된 화면 진입 시점에만 세션을 복구한다.
 * 전역 모든 요청에서 refresh 를 시도하지 않아 첫 응답의 TTFB 리스크를 줄인다.
 * @param request 현재 요청. access/refresh token 쿠키를 읽는다.
 */
export async function proxy(request: NextRequest) {
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
    const response = NextResponse.redirect(buildLoginRedirectUrl(request));
    clearAuthTokenCookies(request, response);
    return response;
  }
}

export const config = {
  // Next.js는 matcher를 정적 리터럴로만 분석하므로 상수 참조 대신 배열을 직접 둔다.
  matcher: ["/mypage/:path*", "/saved/:path*"],
};
