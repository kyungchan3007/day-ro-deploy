/**
 * 유입 측정용 쿼리 키 (shared/analytics).
 * URL 정제·Meta 차단·코스 주소 정리가 같은 목록을 쓰도록 한곳에 둔다.
 * 런타임 의존성이 없는 상수만 두어 정적 import 해도 first-load 비용이 거의 없다.
 */
export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

/** 주소에 남겨도 되는 유입 키(UTM 5개 + 광고 클릭 ID). */
export const ATTRIBUTION_QUERY_KEYS: readonly string[] = [...UTM_KEYS, "fbclid", "gclid"];
