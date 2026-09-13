"use client";

import { useEffect, useRef, useState } from "react";

import type { SituationFlowStep } from "@/features/situation";

export const SITUATION_STEP_GUIDE_DURATION_MS = 2000;

export interface ShouldShowSituationStepGuideOptions {
  step: SituationFlowStep;
  hasExplicitStep: boolean;
}

/**
 * 신규 위저드 진입마다 안내 노출 여부를 판단한다.
 * explicit step query는 딥링크 또는 flow 내부 복귀로 간주한다.
 */
export function shouldShowSituationStepGuide({
  step,
  hasExplicitStep,
}: ShouldShowSituationStepGuideOptions): boolean {
  return step === "time" && !hasExplicitStep;
}

export interface UseSituationStepGuideVisibilityOptions {
  step: SituationFlowStep;
  hasExplicitStep: boolean;
  duration?: number;
}

export function scheduleSituationStepGuideDismiss(
  duration: number,
  onDismiss: () => void,
) {
  const timer = setTimeout(onDismiss, duration);
  return () => clearTimeout(timer);
}

/** client mount 이후에만 신규 진입 여부를 평가한다. */
export function useSituationStepGuideVisibility({
  step,
  hasExplicitStep,
  duration = SITUATION_STEP_GUIDE_DURATION_MS,
}: UseSituationStepGuideVisibilityOptions): boolean {
  const evaluated = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (evaluated.current) {
      return;
    }

    evaluated.current = true;
    setVisible(
      shouldShowSituationStepGuide({
        step,
        hasExplicitStep,
      }),
    );
  }, [hasExplicitStep, step]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    return scheduleSituationStepGuideDismiss(duration, () => setVisible(false));
  }, [duration, visible]);

  return visible;
}
