export const BFF_ENDPOINTS = {
  health: "/api/health",
} as const;

export type BffEndpointKey = keyof typeof BFF_ENDPOINTS;
export type BffEndpoint = (typeof BFF_ENDPOINTS)[BffEndpointKey];
