import "server-only";

import {
  authResponseSchema,
  logoutResponseSchema,
  sessionUserSchema,
  withdrawResponseSchema,
} from "./openapi/dayro.openapi";
import { getBackendBaseUrl } from "./backend-base-url";
import { readBackendJson, toBackendApiError } from "./backend-error";

/**
 * 인증 관련 백엔드 API 호출의 공통 처리기다.
 * @param pathname 백엔드에서 호출할 경로.
 * @param init fetch 옵션.
 * @param fallbackMessage 실패 시 기본 에러 메시지.
 */
async function requestBackendAuth(
  pathname: string,
  init: RequestInit,
  fallbackMessage: string,
) {
  const response = await fetch(new URL(pathname, getBackendBaseUrl()), {
    ...init,
    cache: "no-store",
  });

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toBackendApiError(response, json, fallbackMessage);
  }

  return authResponseSchema.parse(json);
}

/** 카카오 OAuth 시작에 필요한 REST API 키를 읽는다. */
export function getKakaoRestApiKey() {
  return process.env.KAKAO_REST_API_KEY ?? "";
}

/**
 * 카카오 인가 코드를 백엔드 로그인 API에 전달한다.
 * @param code 카카오가 redirect URI 에 붙여준 일회용 인가 코드.
 */
export async function loginWithBackendKakaoCode(code: string) {
  return requestBackendAuth(
    "/api/auth/kakao/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    },
    "oauth_backend_failed",
  );
}

/**
 * 저장된 refresh token 으로 새 앱 access token 을 발급받는다.
 * @param refreshToken 브라우저 쿠키에 저장된 앱 refresh token.
 */
export async function refreshBackendAuth(refreshToken: string) {
  return requestBackendAuth(
    "/api/auth/refresh",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    },
    "유효하지 않은 토큰입니다.",
  );
}

/**
 * 현재 access token 으로 백엔드 현재 사용자 정보를 조회한다.
 * @param accessToken 현재 세션의 앱 access token.
 */
export async function fetchBackendCurrentUser(accessToken: string) {
  const response = await fetch(new URL("/api/auth/me", getBackendBaseUrl()), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toBackendApiError(response, json, "회원 정보를 불러오지 못했습니다.");
  }

  if (
    typeof json !== "object" ||
    json === null ||
    !("data" in json)
  ) {
    throw new Error("회원 정보를 불러오지 못했습니다.");
  }

  return sessionUserSchema.parse(json.data);
}

/**
 * 현재 access token 을 Authorization 헤더에 실어 백엔드 로그아웃을 요청한다.
 * @param accessToken 현재 세션의 앱 access token.
 */
export async function logoutWithBackendAccessToken(accessToken: string) {
  const response = await fetch(new URL("/api/auth/logout", getBackendBaseUrl()), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toBackendApiError(response, json, "로그아웃에 실패했습니다.");
  }

  return logoutResponseSchema.parse(json);
}

/**
 * 현재 access token 을 Authorization 헤더에 실어 백엔드 회원탈퇴를 요청한다.
 * @param accessToken 현재 세션의 앱 access token.
 */
export async function withdrawWithBackendAccessToken(accessToken: string) {
  const response = await fetch(
    new URL("/api/auth/withdraw", getBackendBaseUrl()),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toBackendApiError(response, json, "회원 탈퇴에 실패했습니다.");
  }

  return withdrawResponseSchema.parse(json);
}
