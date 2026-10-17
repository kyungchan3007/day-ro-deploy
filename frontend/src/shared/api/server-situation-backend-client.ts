import "server-only";

import {
  courseCandidateResponseSchema,
  regionPopularKeywordsResponseSchema,
  regionsResponseSchema,
  type CourseCandidateResponse,
  type RegionPopularKeywordsResponse,
  type RegionsResponse,
  type SituationInputRequest,
} from "./openapi/dayro.openapi";
import { getBackendBaseUrl } from "./backend-base-url";
import { BackendApiError, readBackendJson, toBackendApiError } from "./backend-error";

export interface BackendSituationRequestOptions {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

/**
 * 비로그인 허용 API 에 붙이는 선택적 인증 정보.
 * 로그인 상태면 access token 을 실어 백엔드가 회원 기준으로 집계하게 한다(issue #135).
 */
export interface BackendSituationAuthOptions {
  /** httpOnly 쿠키에서 읽은 access token. 없으면 비회원 요청으로 보낸다. */
  accessToken?: string | null;
}

/**
 * access token 이 있으면 Bearer Authorization 헤더를 더한다.
 * 만료·위조 토큰도 백엔드가 비회원으로 처리(401 없음)하므로 여기서 refresh 하지 않는다.
 */
function withOptionalBearer(
  headers: Record<string, string>,
  accessToken?: string | null,
): Record<string, string> {
  return accessToken ? { ...headers, Authorization: `Bearer ${accessToken}` } : headers;
}

/**
 * 상황입력 도메인의 외부 백엔드 호출 공통 transport.
 * `pathname` 과 `init` 으로 실제 HTTP 요청을 만들고, `parse` 로 응답 계약을 검증해
 * 서버 계약 계층이나 Route Handler 가 재사용할 수 있는 typed result 로 반환한다.
 */
async function requestBackendSituation<T>(
  pathname: string,
  init: RequestInit,
  parse: (json: unknown) => T,
  fallbackMessage: string,
  options?: BackendSituationRequestOptions,
): Promise<T> {
  const response = await fetch(new URL(pathname, getBackendBaseUrl()), {
    ...init,
    cache: options?.cache ?? "no-store",
    next: options?.next,
  });

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toBackendApiError(response, json, fallbackMessage);
  }

  return parse(json);
}

/**
 * 외부 백엔드의 지역 목록 API 를 직접 호출한다.
 * 서버 계약 계층에서 캐시 정책을 주입받아 `RegionsResponse` 계약으로 반환한다.
 */
export function fetchSituationBackendRegions(
  options?: BackendSituationRequestOptions,
): Promise<RegionsResponse> {
  return requestBackendSituation(
    "/api/regions",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
    (json) => regionsResponseSchema.parse(json),
    "지역 목록을 불러오지 못했습니다.",
    options,
  );
}

/**
 * 외부 백엔드의 지역 인기 검색어 API 를 직접 호출한다.
 * 서버 계약 계층에서 캐시 정책을 주입받아 `RegionPopularKeywordsResponse` 계약으로 반환한다.
 */
export function fetchSituationBackendPopularKeywords(
  options?: BackendSituationRequestOptions,
): Promise<RegionPopularKeywordsResponse> {
  return requestBackendSituation(
    "/api/regions/popular-keywords",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
    (json) => regionPopularKeywordsResponseSchema.parse(json),
    "인기 검색어를 불러오지 못했습니다.",
    options,
  );
}

/**
 * 외부 백엔드의 상황 제출 API 를 직접 호출한다.
 * 상황 입력 payload 를 backend request body 로 전달하고 추천 결과 계약을 반환한다.
 * 로그인 상태면 access token 을 Bearer 헤더로 함께 보낸다.
 */
export function submitSituationBackendRequest(
  request: SituationInputRequest,
  { accessToken }: BackendSituationAuthOptions = {},
): Promise<CourseCandidateResponse> {
  return requestBackendSituation(
    "/api/situations",
    {
      method: "POST",
      headers: withOptionalBearer(
        {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        accessToken,
      ),
      body: JSON.stringify(request),
    },
    (json) => courseCandidateResponseSchema.parse(json),
    "추천 코스를 불러오지 못했습니다.",
  );
}

/** 추천 세션 requestId 로 허용하는 문자(백엔드 UUID 포함). `.`·`/`를 막아 경로 정규화를 차단한다. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * 외부 백엔드의 다른 코스 보기 retry API 를 직접 호출한다.
 * 현재 추천 세션의 requestId 를 path 에 실어 새 후보를 요청한다.
 * 로그인 상태면 access token 을 Bearer 헤더로 함께 보낸다.
 */
export function retrySituationBackendRequest(
  requestId: string,
  { accessToken }: BackendSituationAuthOptions = {},
): Promise<CourseCandidateResponse> {
  // `..` 은 encodeURIComponent 로도 그대로라 `/api/retry` 로 정규화될 수 있어 형식부터 검증한다(issue #139).
  if (!REQUEST_ID_PATTERN.test(requestId)) {
    return Promise.reject(new BackendApiError(400, "잘못된 추천 재요청입니다."));
  }
  return requestBackendSituation(
    `/api/situations/${encodeURIComponent(requestId)}/retry`,
    {
      method: "POST",
      headers: withOptionalBearer({ Accept: "application/json" }, accessToken),
    },
    (json) => courseCandidateResponseSchema.parse(json),
    "다른 추천 코스를 불러오지 못했습니다.",
  );
}
