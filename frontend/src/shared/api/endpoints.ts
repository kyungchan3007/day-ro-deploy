export const BFF_ENDPOINTS = {
  health: "/api/health",
  authKakaoToken: "/api/auth/kakao/token",
  authMe: "/api/auth/me",
  authRefresh: "/api/auth/refresh",
  authLogout: "/api/auth/logout",
  authWithdraw: "/api/auth/withdraw",
  regions: "/api/regions",
  regionPopularKeywords: "/api/regions/popular-keywords",
  situations: "/api/situations",
  courses: "/api/courses",
} as const;

export const SITUATION_RETRY_PATH_TEMPLATE = "/api/situations/:requestId/retry";

export function buildSituationRetryEndpoint(requestId: string) {
  return `${BFF_ENDPOINTS.situations}/${encodeURIComponent(requestId)}/retry`;
}

export type BffEndpointKey = keyof typeof BFF_ENDPOINTS;
export type BffEndpoint = (typeof BFF_ENDPOINTS)[BffEndpointKey];
