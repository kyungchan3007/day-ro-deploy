"use client";

import { useEffect, useRef } from "react";

import { SITUATION_RESULT_STEP, type SituationFlowStep } from "@/features/situation";
import type { ToastVariant } from "@/shared/ui/toast";
import { SITUATION_FLOW_MESSAGES } from "./situation-flow-messages";

/**
 * 재추천 잔여 횟수가 0이 된 결과 화면에서 소진 안내를 1회 띄우는 훅 (widgets/situation).
 *
 * 잔여 횟수 비교값은 결과 화면에서만 갱신한다. loading 화면에서 먼저 0을 저장하면
 * 마지막 재추천 뒤 결과 화면의 소진 안내가 빠진다(#126 회귀 방지).
 */
export function useRetryExhaustedNotice({
  step,
  remainingRetries,
  show,
}: {
  step: SituationFlowStep;
  remainingRetries?: number;
  show: (message: string, variant?: ToastVariant) => void;
}): void {
  const previousRemainingRetries = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (step !== SITUATION_RESULT_STEP) {
      return;
    }

    if (remainingRetries === 0 && previousRemainingRetries.current !== 0) {
      show(SITUATION_FLOW_MESSAGES.retryUsedUp, "info");
    }

    previousRemainingRetries.current = remainingRetries;
  }, [remainingRetries, show, step]);
}
