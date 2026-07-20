import type { SituationAnswers } from "./types";

export const SITUATION_STEPS = [
  { key: "time", nextLabel: "다음은 어디서 만날까요?" },
  { key: "region", nextLabel: "다음은 어떻게 이동할까요?" },
  { key: "transport", nextLabel: "추천받기!" },
] as const;

export type SituationStepKey = (typeof SITUATION_STEPS)[number]["key"];
export type SituationFlowStep = SituationStepKey | "loading";

export const SITUATION_LOADING_STEP: SituationFlowStep = "loading";
export const TOTAL_SITUATION_STEPS = SITUATION_STEPS.length;

export function resolveSituationStep(
  rawStep: string | null | undefined,
): SituationFlowStep {
  if (rawStep === SITUATION_LOADING_STEP) {
    return SITUATION_LOADING_STEP;
  }

  return (
    SITUATION_STEPS.find((step) => step.key === rawStep)?.key ??
    SITUATION_STEPS[0].key
  );
}

export function getSituationStepIndex(step: SituationStepKey): number {
  return SITUATION_STEPS.findIndex((item) => item.key === step);
}

export function getSituationNextLabel(step: SituationStepKey): string {
  return SITUATION_STEPS[getSituationStepIndex(step)].nextLabel;
}

export function getPreviousSituationStep(step: SituationStepKey): SituationStepKey | null {
  const index = getSituationStepIndex(step);
  return index > 0 ? SITUATION_STEPS[index - 1].key : null;
}

export function getNextSituationStep(step: SituationStepKey): SituationStepKey | null {
  const index = getSituationStepIndex(step);
  return index < SITUATION_STEPS.length - 1 ? SITUATION_STEPS[index + 1].key : null;
}

export function patchSituationAnswers(
  prev: SituationAnswers,
  patch: Partial<SituationAnswers>,
): SituationAnswers {
  return { ...prev, ...patch };
}
