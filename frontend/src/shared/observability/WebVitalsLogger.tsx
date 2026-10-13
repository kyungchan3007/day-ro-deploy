"use client";

import { useWebVitalsLogger } from "./useWebVitalsLogger";

export interface WebVitalsLoggerProps {
  /** 로그에 표시할 라우트/화면 이름(예: "home", "course/new"). */
  route: string;
}

/**
 * 개발 환경 전용 Web Vitals 계측 로거 (shared/observability).
 *
 * 서버 컴포넌트 페이지에서 계측을 붙이기 위한 클라이언트 경계 컴포넌트다.
 * 계측 로직은 `useWebVitalsLogger`가 맡고, UI 는 렌더하지 않는다(null).
 *
 * NOTE: 스텝/쿼리 전환(예: `/course/new?step=`)에서 INP·CLS 를 끊김 없이 측정하려면,
 * 페이지가 아니라 해당 route 의 layout 에 마운트해 전환 간 유지되게 하는 것을 권장한다.
 */
export function WebVitalsLogger({ route }: WebVitalsLoggerProps) {
  useWebVitalsLogger(route);
  return null;
}
