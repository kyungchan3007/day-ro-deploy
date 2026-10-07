"use client";

import { useAnalytics } from "./useAnalytics";

/**
 * 활성화된 분석 작업만 지연 로드하는 root client leaf.
 * @returns null. 외부 script 주입은 지연 로드된 runtime이 담당한다.
 */
export function AnalyticsTracker() {
  useAnalytics();
  return null;
}
