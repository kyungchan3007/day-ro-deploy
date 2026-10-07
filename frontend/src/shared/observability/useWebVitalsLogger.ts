"use client";

import { useEffect } from "react";
import {
  onCLS,
  onFCP,
  onINP,
  onLCP,
  onTTFB,
  type MetricWithAttribution,
} from "web-vitals/attribution";

/**
 * 개발 환경 전용 Web Vitals 계측 훅 (shared/observability).
 *
 * CLS / FCP / INP / LCP / TTFB 를 attribution 과 함께 콘솔에 남긴다.
 * `route` 라벨로 어느 화면의 지표인지 구분한다. 개발 환경이 아니면 아무것도 하지 않는다.
 * @param route 로그에 표시할 라우트/화면 이름(예: "home", "course/new").
 */
export function useWebVitalsLogger(route: string): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const report = (metric: MetricWithAttribution) => {
      console.info("[Dayro Web Vitals]", {
        route,
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        attribution: metric.attribution,
      });
    };

    // reportAllChanges: 인터랙션(스텝 클릭 등)마다 즉시 로깅.
    // 기본값은 페이지 이탈/백그라운드 시점에만 INP·CLS 최종값을 보고하므로, 스텝 측정엔 부적합하다.
    const opts = { reportAllChanges: true };
    onCLS(report, opts);
    onFCP(report, opts);
    onINP(report, opts);
    onLCP(report, opts);
    onTTFB(report, opts);
  }, [route]);
}
