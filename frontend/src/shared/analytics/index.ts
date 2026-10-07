/** 무거운 분석 runtime을 정적으로 참조하지 않는 public API. */
export { getAnalyticsConfig } from "./config";
export { trackEvent } from "./track";
export { scheduleAnalytics } from "./dispatch";
export type { AnalyticsContext } from "./dispatch";
export type { AnalyticsEvents, EventName } from "./events";
export { ATTRIBUTION_QUERY_KEYS } from "./query-keys";
