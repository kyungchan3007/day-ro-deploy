import type { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "../../features/auth/model/oauth";

/** 현재 요청이 HTTPS 인지 확인해 secure 쿠키 여부를 결정한다. */
function isSecureRequest(request: NextRequest) {
  return request.nextUrl.protocol === "https:";
}

/**
 * 서버에서 발급하는 인증 쿠키의 공통 옵션을 만든다.
 * @param request 현재 요청. 프로토콜을 보고 secure 옵션을 계산한다.
 */
function getCookieBaseOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
  };
}

/**
 * 카카오 로그인 완료 후 브라우저가 다시 돌아올 프런트 콜백 URL을 만든다.
 * @param request 현재 요청. origin 을 기준으로 절대 URL을 생성한다.
 */
export function buildKakaoCallbackUrl(request: NextRequest) {
  return new URL("/api/auth/kakao/callback", request.nextUrl.origin).toString();
}

/**
 * 요청 쿠키에서 access token 값을 읽는다.
 * @param request 현재 요청.
 */
export function readAccessTokenCookie(request: NextRequest) {
  return request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null;
}

/**
 * 요청 쿠키에서 refresh token 값을 읽는다.
 * @param request 현재 요청.
 */
export function readRefreshTokenCookie(request: NextRequest) {
  return request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value ?? null;
}

/**
 * OAuth state 값을 httpOnly 쿠키로 저장한다.
 * @param request 현재 요청.
 * @param response 브라우저로 돌려줄 응답. 이 응답에 쿠키를 기록한다.
 * @param state 카카오 로그인 요청-응답 검증용 난수 문자열.
 */
export function setOAuthStateCookie(
  request: NextRequest,
  response: NextResponse,
  state: string,
) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, state, {
    ...getCookieBaseOptions(request),
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
}

/**
 * 카카오 로그인 검증이 끝난 뒤 OAuth state 쿠키를 제거한다.
 * @param request 현재 요청.
 * @param response 브라우저로 돌려줄 응답. 이 응답에 만료 쿠키를 기록한다.
 */
export function clearOAuthStateCookie(
  request: NextRequest,
  response: NextResponse,
) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...getCookieBaseOptions(request),
    maxAge: 0,
  });
}

/**
 * 앱 세션용 access/refresh token 쿠키를 함께 저장한다.
 * @param request 현재 요청.
 * @param response 브라우저로 돌려줄 응답.
 * @param tokens 백엔드 로그인/재발급 응답에서 받은 토큰 묶음.
 */
export function setAuthTokenCookies(
  request: NextRequest,
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
    ...getCookieBaseOptions(request),
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    ...getCookieBaseOptions(request),
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * 앱 세션을 종료할 때 access/refresh token 쿠키를 모두 제거한다.
 * @param request 현재 요청.
 * @param response 브라우저로 돌려줄 응답.
 */
export function clearAuthTokenCookies(
  request: NextRequest,
  response: NextResponse,
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", {
    ...getCookieBaseOptions(request),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", {
    ...getCookieBaseOptions(request),
    maxAge: 0,
  });
}
