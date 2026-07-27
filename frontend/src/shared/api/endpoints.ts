export const BFF_ENDPOINTS = {
  health: "/api/health",
  authKakaoToken: "/api/auth/kakao/token",
  authRefresh: "/api/auth/refresh",
  authLogout: "/api/auth/logout",
  regions: "/api/regions",
  situations: "/api/situations",
} as const;

export type BffEndpointKey = keyof typeof BFF_ENDPOINTS;
export type BffEndpoint = (typeof BFF_ENDPOINTS)[BffEndpointKey];
