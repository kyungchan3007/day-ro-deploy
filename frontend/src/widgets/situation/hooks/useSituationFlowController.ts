"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  findRegionAreaLabel,
  getNextSituationStep,
  getPreviousSituationStep,
  getSituationNextLabel,
  getSituationStepIndex,
  patchSituationAnswers,
  SITUATION_LOADING_STEP,
  SITUATION_STEPS,
  TOTAL_SITUATION_STEPS,
  type SituationAnswers,
  type SituationFlowStep,
  type SituationStepKey,
  type TimeRange,
  type TransportSelection,
} from "@/features/situation";

export function useSituationFlowController() {
  const router = useRouter();

  const [answers, setAnswers] = useState<SituationAnswers>({});
  const [currentStep, setCurrentStep] = useState<SituationFlowStep>(
    SITUATION_STEPS[0].key,
  );

  const goStep = (step: SituationFlowStep) => setCurrentStep(step);

  if (currentStep === SITUATION_LOADING_STEP) {
    return {
      kind: "loading" as const,
      answers,
    };
  }

  const activeStep = currentStep as SituationStepKey;
  const stepIndex = getSituationStepIndex(activeStep);
  const previousStep = getPreviousSituationStep(activeStep);
  const nextStep = getNextSituationStep(activeStep);

  const handleBack = () => {
    if (previousStep) {
      goStep(previousStep);
      return;
    }

    router.back();
  };

  const setTime = (time: TimeRange) => {
    setAnswers((prev) => patchSituationAnswers(prev, { time }));
    if (nextStep) {
      goStep(nextStep);
    }
  };

  const setRegion = (region: string) => {
    setAnswers((prev) => patchSituationAnswers(prev, { region }));
    if (nextStep) {
      goStep(nextStep);
    }
  };

  const setTransport = (transport: TransportSelection) => {
    setAnswers((prev) => patchSituationAnswers(prev, { transport }));
    goStep(SITUATION_LOADING_STEP);
  };

  /** 요약 칩에서 특정 스텝으로 되돌아가 수정. */
  const editStep = (step: SituationStepKey) => goStep(step);

  return {
    kind: "step" as const,
    currentStep: activeStep,
    stepNumber: stepIndex + 1,
    totalSteps: TOTAL_SITUATION_STEPS,
    nextLabel: getSituationNextLabel(activeStep),
    destinationLabel: findRegionAreaLabel(answers.region) ?? "목적지",
    answers,
    handleBack,
    editStep,
    setTime,
    setRegion,
    setTransport,
  };
}
