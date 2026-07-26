import { z } from "zod";
import type { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/features/auth/model/oauth";
import { authResponseSchema } from "@/shared/api/openapi/dayro.openapi";

const kakaoTokenResponseSchema = z.object({
  access_token: z.string().min(1),
});

function isSecureRequest(request: NextRequest) {
  return request.nextUrl.protocol === "https:";
}

function getCookieBaseOptions(request: NextRequest) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
  };
}

export function buildKakaoCallbackUrl(request: NextRequest) {
  return new URL("/api/auth/kakao/callback", request.nextUrl.origin).toString();
}

export function getKakaoRestApiKey() {
  return process.env.KAKAO_REST_API_KEY ?? "";
}

export function getKakaoClientSecret() {
  return process.env.KAKAO_CLIENT_SECRET ?? "";
}

export function getBackendBaseUrl() {
  return process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";
}

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

export function clearOAuthStateCookie(
  request: NextRequest,
  response: NextResponse,
) {
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, "", {
    ...getCookieBaseOptions(request),
    maxAge: 0,
  });
}

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

export async function exchangeKakaoCodeForAccessToken(params: {
  code: string;
  redirectUri: string;
}) {
  const clientId = getKakaoRestApiKey();
  const clientSecret = getKakaoClientSecret();

  if (!clientId) {
    throw new Error("oauth_config_missing");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: params.redirectUri,
    code: params.code,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const response = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("oauth_token_exchange_failed");
  }

  const json = await response.json();
  return kakaoTokenResponseSchema.parse(json);
}

export async function loginWithBackendKakaoAccessToken(accessToken: string) {
  const response = await fetch(
    new URL("/api/auth/kakao/callback", getBackendBaseUrl()),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken }),
      cache: "no-store",
    },
  );

  const json = await response.json();

  if (!response.ok) {
    const parsed = authResponseSchema.safeParse(json);
    if (parsed.success) {
      throw new Error(parsed.data.message);
    }

    const message =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof json.message === "string"
        ? json.message
        : "oauth_backend_failed";

    throw new Error(message);
  }

  return authResponseSchema.parse(json);
}
