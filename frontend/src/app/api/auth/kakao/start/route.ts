import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoAuthorizeUrl,
  createOAuthState,
  sanitizeLoginNextPath,
} from "@/features/auth/model/oauth";
import {
  buildKakaoCallbackUrl,
  clearOAuthNextCookie,
  getKakaoRestApiKey,
  setOAuthNextCookie,
  setOAuthStateCookie,
} from "@/shared/api/server-auth";

export async function GET(request: NextRequest) {
  const clientId = getKakaoRestApiKey();

  if (!clientId) {
    const failureUrl = new URL("/login?error=oauth_config_missing", request.url);
    return NextResponse.redirect(failureUrl);
  }

  const state = createOAuthState();
  const redirectUri = buildKakaoCallbackUrl(request);
  const authorizeUrl = buildKakaoAuthorizeUrl({
    clientId,
    redirectUri,
    state,
  });

  const response = NextResponse.redirect(authorizeUrl);
  setOAuthStateCookie(request, response, state);
  // 로그인 후 돌아갈 화면: 검증된 내부 경로만 보관하고, 없으면 이전 시도의 값을 지운다.
  const next = sanitizeLoginNextPath(request.nextUrl.searchParams.get("next"));
  if (next) {
    setOAuthNextCookie(request, response, next);
  } else {
    clearOAuthNextCookie(request, response);
  }
  return response;
}
