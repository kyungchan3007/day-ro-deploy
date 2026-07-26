import { NextRequest, NextResponse } from "next/server";
import {
  buildLoginErrorSearchParams,
  OAUTH_STATE_COOKIE_NAME,
} from "@/features/auth/model/oauth";
import {
  buildKakaoCallbackUrl,
  clearOAuthStateCookie,
  exchangeKakaoCodeForAccessToken,
  loginWithBackendKakaoAccessToken,
  setAuthTokenCookies,
} from "@/shared/api/server-auth";

function redirectToLogin(
  request: NextRequest,
  params: {
    error?: string;
    message?: string;
  },
) {
  const query = buildLoginErrorSearchParams(params);
  const pathname = query ? `/login?${query}` : "/login";
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (error) {
    return redirectToLogin(request, { error: "oauth_cancelled" });
  }

  if (!storedState) {
    return redirectToLogin(request, { error: "oauth_state_missing" });
  }

  if (!state || state !== storedState) {
    return redirectToLogin(request, { error: "oauth_state_mismatch" });
  }

  if (!code) {
    return redirectToLogin(request, { error: "oauth_code_missing" });
  }

  try {
    const redirectUri = buildKakaoCallbackUrl(request);
    const kakaoToken = await exchangeKakaoCodeForAccessToken({
      code,
      redirectUri,
    });
    const backendAuth = await loginWithBackendKakaoAccessToken(
      kakaoToken.access_token,
    );

    const response = NextResponse.redirect(new URL("/", request.url));
    clearOAuthStateCookie(request, response);
    setAuthTokenCookies(request, response, {
      accessToken: backendAuth.data.accessToken,
      refreshToken: backendAuth.data.refreshToken,
    });
    return response;
  } catch (caughtError) {
    const message =
      caughtError instanceof Error
        ? caughtError.message
        : "로그인을 완료하지 못했어요. 다시 시도해주세요.";

    return redirectToLogin(request, {
      error: "oauth_backend_failed",
      message,
    });
  }
}
