import { NextRequest, NextResponse } from "next/server";
import {
  buildKakaoAuthorizeUrl,
  createOAuthState,
} from "@/features/auth/model/oauth";
import {
  buildKakaoCallbackUrl,
  getKakaoRestApiKey,
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
  return response;
}
