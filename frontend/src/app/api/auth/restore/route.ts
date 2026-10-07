import { NextRequest, NextResponse } from "next/server";
import { sanitizeLoginNextPath } from "@/features/auth/model/oauth";
import {
  clearAuthTokenCookies,
  readRefreshTokenCookie,
  refreshBackendAuth,
  setAuthTokenCookies,
} from "@/shared/api/server-auth";
import { isBackendAuthRejection } from "@/shared/api/backend-error";
import { buildLoginRedirectPath } from "@/shared/lib/login-redirect";

/**
 * 보호 화면 진입 시 세션 복구(issue #146, 이전 `proxy.ts` 역할).
 *
 * access token 쿠키가 사라지고 refresh token 만 남은 사용자를 보호 화면(Server Component)이 이 경로로 보낸다.
 * Server Component 는 쿠키를 쓸 수 없어 refresh 결과를 이 Route Handler 가 쿠키로 심고 원래 화면으로 돌려보낸다.
 * - 성공: 새 토큰 쿠키 + `next` 로 리다이렉트
 * - refresh token 거절: 쿠키 정리 + 로그인으로 리다이렉트
 * - 백엔드 장애: 쿠키 유지 + 로그인으로 리다이렉트(`next`로 되돌리면 같은 복구를 반복하므로 보내지 않는다)
 * @param request `?next=<내부 경로>`. 외부·`/api`·`/login` 경로는 `/`로 바꾼다.
 */
export async function GET(request: NextRequest) {
  const nextPath = sanitizeLoginNextPath(request.nextUrl.searchParams.get("next")) ?? "/";
  const loginUrl = new URL(buildLoginRedirectPath(nextPath), request.url);
  const refreshToken = readRefreshTokenCookie(request);

  if (!refreshToken) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const auth = await refreshBackendAuth(refreshToken);
    const response = NextResponse.redirect(new URL(nextPath, request.url));

    setAuthTokenCookies(request, response, {
      accessToken: auth.data.accessToken,
      refreshToken: auth.data.refreshToken,
    });

    return response;
  } catch (error) {
    // refresh token 이 거절됐을 때만 세션을 정리한다. 백엔드 장애면 쿠키를 유지한다(issue #139 S8).
    if (isBackendAuthRejection(error)) {
      const response = NextResponse.redirect(loginUrl);
      clearAuthTokenCookies(request, response);
      return response;
    }
    console.error("[BFF] 세션 복구 실패(세션 유지)", error);
    return NextResponse.redirect(loginUrl);
  }
}
