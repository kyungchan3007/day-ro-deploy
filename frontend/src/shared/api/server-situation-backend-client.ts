import {
  courseCandidateResponseSchema,
  regionsResponseSchema,
  type CourseCandidateResponse,
  type RegionsResponse,
  type SituationInputRequest,
} from "./openapi/dayro.openapi";

export interface BackendSituationRequestOptions {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

/**
 * 상황입력 도메인이 붙는 외부 백엔드 origin 을 결정한다.
 * `BACKEND_API_BASE_URL` 이 없으면 로컬 개발 기본값 `http://localhost:8080` 을 사용한다.
 */
function getBackendBaseUrl() {
  return process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";
}

/**
 * 백엔드 에러 payload 에 `message` 가 있으면 우선 사용하고,
 * 없으면 호출자가 넘긴 fallback 문구를 그대로 반환한다.
 */
function getBackendErrorMessage(json: unknown, fallbackMessage: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    const { message } = json;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
}

/**
 * 백엔드 응답 본문을 한 번만 읽어 JSON 으로 변환한다.
 * 빈 본문은 `null` 로 취급해 downstream schema parse 전에 분기할 수 있게 한다.
 */
async function parseJsonResponse(response: Response) {
  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
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

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getBackendErrorMessage(json, fallbackMessage));
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
 * 외부 백엔드의 상황 제출 API 를 직접 호출한다.
 * 상황 입력 payload 를 backend request body 로 전달하고 추천 결과 계약을 반환한다.
 */
export function submitSituationBackendRequest(
  request: SituationInputRequest,
): Promise<CourseCandidateResponse> {
  return requestBackendSituation(
    "/api/situations",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
    (json) => courseCandidateResponseSchema.parse(json),
    "추천 코스를 불러오지 못했습니다.",
  );
}
