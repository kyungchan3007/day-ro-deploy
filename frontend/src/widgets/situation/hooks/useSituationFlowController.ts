"use client";

import { useEffect, useRef, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

import {
  buildSituationRequest,
  getNextSituationStep,
  getPreviousSituationStep,
  getSituationNextLabel,
  getSituationStepIndex,
  patchSituationAnswers,
  requestCourseCandidates,
  resolveSituationStep,
  SITUATION_LOADING_STEP,
  TOTAL_SITUATION_STEPS,
  type PurposeChoice,
  type SituationAnswers,
  type SituationRegionValue,
  type SituationStepKey,
  type TimeRange,
} from "@/features/situation";
import { saveLastGeneratedCourseCandidates } from "@/features/situation/lib/generated-course-storage";

function updateStepParam(
  params: ReadonlyURLSearchParams,
  step: string,
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.set("step", step);
  return next;
}

export function useSituationFlowController() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [answers, setAnswers] = useState<SituationAnswers>({});
  const submittedKeyRef = useRef<string | null>(null);
  const currentStep = resolveSituationStep(params.get("step"));

  const goStep = (step: string) => {
    const next = updateStepParam(params, step);
    router.push(`${pathname}?${next.toString()}`);
  };

  useEffect(() => {
    if (currentStep !== SITUATION_LOADING_STEP) {
      return;
    }

    if (!answers.time || !answers.region || !answers.purpose) {
      goStep("time");
      return;
    }

    const submissionKey = JSON.stringify({
      time: answers.time,
      region: answers.region,
      purpose: answers.purpose,
    });

    if (submittedKeyRef.current === submissionKey) {
      return;
    }

    submittedKeyRef.current = submissionKey;

    let cancelled = false;

    const submitSituation = async () => {
      try {
        const request = buildSituationRequest(answers);
        const response = await requestCourseCandidates(request);

        if (cancelled) {
          return;
        }

        saveLastGeneratedCourseCandidates(response);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("failed_to_submit_situation", error);
        submittedKeyRef.current = null;
        goStep("purpose");
      }
    };

    void submitSituation();

    return () => {
      cancelled = true;
    };
  }, [answers, currentStep, pathname, router]);

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

    router.push("/");
  };

  const setTime = (time: TimeRange) => {
    setAnswers((prev) => patchSituationAnswers(prev, { time }));
    if (nextStep) {
      goStep(nextStep);
    }
  };

  const setRegion = (region: SituationRegionValue) => {
    setAnswers((prev) => patchSituationAnswers(prev, { region }));
    if (nextStep) {
      goStep(nextStep);
    }
  };

  const setPurpose = (purpose: PurposeChoice) => {
    setAnswers((prev) => patchSituationAnswers(prev, { purpose }));
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
    answers,
    handleBack,
    editStep,
    setTime,
    setRegion,
    setPurpose,
  };
}
