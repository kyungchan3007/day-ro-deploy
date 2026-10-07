"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scheduleAnalytics } from "./dispatch";

/**
 * pathname 변경을 구독하고 활성 환경에서만 페이지뷰 runtime을 로드한다.
 * @returns 없음. root의 정적 경로에는 config와 작은 예약 계층만 포함한다.
 */
export function useAnalytics(): void {
  const pathname = usePathname();
  useEffect(() => {
    scheduleAnalytics(async (context) => {
      const runtime = await import("./runtime");
      runtime.trackPageView(context);
    });
  }, [pathname]);
}
