import "server-only";

import type { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  OAUTH_NEXT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "./auth-cookies";

/**
 * 인증 쿠키에 Secure 를 붙일지 결정한다(issue #139 S6).
 * - 요청이 HTTPS 이거나 프록시가 `x-forwarded-proto: https`를 알려주면 Secure.
 * - 운영 빌드는 TLS 를 앞단(CDN·LB)에서 끝내 앱이 http 로 받더라도 항상 Secure.
 * - 예외는 요청 값(Host 등)이 아니라 서버 설정으로만 연다: 로컬 운영 빌드·e2e start 모드는
 *   `AUTH_COOKIE_ALLOW_INSECURE=1`을 명시해야 http 쿠키를 허용한다.
 */
function isSecureRequest(request: NextRequest) {
  if (request.nextUrl.protocol === "https:") {
    return true;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto === "https") {
    return true;
  }

  return (
    process.env.NODE_ENV === "production" &&
    process.env.AUTH_COOKIE_ALLOW_INSECURE !== "1"
  );
}

/**
 * 카카오 redirect_uri 기준 공개 origin. `APP_ORIGIN`이 http(s) 절대 URL 일 때만 쓴다.
 * 형식이 틀리면(스킴 누락 등) 무시하고 요청 origin 으로 대체해 로그인 시작이 500 으로 깨지지 않게 한다.
 */
function getConfiguredAppOrigin(): string | null {
  const configured = process.env.APP_ORIGIN;
  if (!configured) {
    return null;
  }
  try {
    const url = new URL(configured);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * 서버에서 발급하는 인증 쿠키의 공통 옵션을 만든다.
 * @param request 현재 요청. 프로토콜·프록시 헤더·실행 환경을 보고 secure 옵션을 계산한다.
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
 * 운영에서는 공개 origin 환경변수 `APP_ORIGIN`(예: `https://dayro.kr`)을 기준으로 만들어,
 * 프록시 뒤에서 Host 헤더가 내부 주소로 바뀌어도 카카오에 등록한 redirect_uri 와 어긋나지 않게 한다(issue #139 S7).
 * 설정이 없으면 현재 요청 origin 을 쓴다(로컬·e2e).
 * @param request 현재 요청.
 */
export function buildKakaoCallbackUrl(request: NextRequest) {
  const origin = getConfiguredAppOrigin() ?? request.nextUrl.origin;
  return new URL("/api/auth/kakao/callback", origin).toString();
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
 * 로그인 후 돌아갈 내부 경로를 OAuth 왕복 동안 httpOnly 쿠키로 보관한다(issue #131).
 * 호출 전에 `sanitizeLoginNextPath` 로 검증한 값만 넘긴다.
 * @param request 현재 요청.
 * @param response 카카오 authorize 로 보내는 응답.
 * @param next 검증된 내부 경로.
 */
export function setOAuthNextCookie(
  request: NextRequest,
  response: NextResponse,
  next: string,
) {
  response.cookies.set(OAUTH_NEXT_COOKIE_NAME, next, {
    ...getCookieBaseOptions(request),
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
}

/**
 * 콜백에서 보관해 둔 next 원본 값을 읽는다. 사용 전 반드시 다시 검증한다.
 * @param request 콜백 요청.
 * @returns 쿠키 원본 값 또는 null.
 */
export function readOAuthNextCookie(request: NextRequest) {
  return request.cookies.get(OAUTH_NEXT_COOKIE_NAME)?.value ?? null;
}

/**
 * next 쿠키를 제거한다. 콜백 성공·실패 모두에서 호출한다.
 * @param request 현재 요청.
 * @param response 브라우저로 돌려줄 응답.
 */
export function clearOAuthNextCookie(request: NextRequest, response: NextResponse) {
  response.cookies.set(OAUTH_NEXT_COOKIE_NAME, "", {
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
