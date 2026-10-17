import { NextRequest, NextResponse } from "next/server";
import { setAuthEventCookie } from "@/shared/api/server-auth-event";
import {
  buildLoginErrorSearchParams,
  OAUTH_STATE_COOKIE_NAME,
  sanitizeLoginNextPath,
} from "@/features/auth/model/oauth";
import {
  clearOAuthNextCookie,
  clearOAuthStateCookie,
  loginWithBackendKakaoCode,
  readOAuthNextCookie,
  setAuthTokenCookies,
} from "@/shared/api/server-auth";

/**
 * 로그인 실패·취소 시 로그인 화면으로 돌려보낸다.
 * 다시 시도해도 원래 화면으로 돌아가도록 검증된 next 를 쿼리로 유지하고, next 쿠키는 지운다.
 * @param request 콜백 요청.
 * @param params 오류 코드(화면 문구는 코드로만 매핑한다).
 * @param next 쿠키에서 읽어 검증한 복귀 경로.
 */
function redirectToLogin(
  request: NextRequest,
  params: {
    error?: string;
  },
  next: string | null,
) {
  const query = buildLoginErrorSearchParams({ ...params, next });
  const pathname = query ? `/login?${query}` : "/login";
  const response = NextResponse.redirect(new URL(pathname, request.url));
  clearOAuthNextCookie(request, response);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;
  // 쿠키 값도 신뢰하지 않고 다시 검증한다(오픈 리다이렉트 방지, issue #131).
  const next = sanitizeLoginNextPath(readOAuthNextCookie(request));

  if (error) {
    return redirectToLogin(request, { error: "oauth_cancelled" }, next);
  }

  if (!storedState) {
    return redirectToLogin(request, { error: "oauth_state_missing" }, next);
  }

  if (!state || state !== storedState) {
    return redirectToLogin(request, { error: "oauth_state_mismatch" }, next);
  }

  if (!code) {
    return redirectToLogin(request, { error: "oauth_code_missing" }, next);
  }

  try {
    const backendAuth = await loginWithBackendKakaoCode(code);

    const response = NextResponse.redirect(new URL(next ?? "/", request.url));
    clearOAuthStateCookie(request, response);
    clearOAuthNextCookie(request, response);
    setAuthTokenCookies(request, response, {
      accessToken: backendAuth.data.accessToken,
      refreshToken: backendAuth.data.refreshToken,
    });
    setAuthEventCookie(response, backendAuth.data.isNewUser);
    return response;
  } catch {
    // 백엔드 예외 메시지는 URL 에 싣지 않고 오류 코드만 전달한다(issue #139 S4).
    return redirectToLogin(request, { error: "oauth_backend_failed" }, next);
  }
}
