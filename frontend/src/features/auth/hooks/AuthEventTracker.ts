"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scheduleAnalytics } from "@/shared/analytics";

/**
 * 경로 변경 시 활성 gate 뒤에서만 인증 신호 소비 모듈을 지연 로드한다.
 * @returns null. 소비는 분석 작업과 동일한 순차 체인에서 수행한다.
 */
export function AuthEventTracker() {
  const pathname = usePathname();
  useEffect(() => {
    scheduleAnalytics(async (context) => {
      const { consumeAuthEvent } = await import("../model/auth-event");
      consumeAuthEvent(context);
    });
  }, [pathname]);
  return null;
}
