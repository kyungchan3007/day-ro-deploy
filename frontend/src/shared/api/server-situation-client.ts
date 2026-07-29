import {
  courseCandidateResponseSchema,
  regionsResponseSchema,
  type CourseCandidateResponse,
  type RegionsResponse,
  type SituationInputRequest,
} from "./openapi/dayro.openapi";

interface BackendSituationRequestOptions {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

function getBackendBaseUrl() {
  return process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";
}

function getBackendErrorMessage(json: unknown, fallbackMessage: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    const { message } = json;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

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

export function fetchBackendRegions(
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

export function submitBackendSituation(
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
