"use client";

import { useCallback, useEffect, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
  type ReadonlyURLSearchParams,
} from "next/navigation";

import {
  getNextSituationStep,
  getPreviousSituationStep,
  getSituationNextLabel,
  getSituationStepIndex,
  patchSituationAnswers,
  resolveSituationStep,
  SITUATION_LOADING_STEP,
  SITUATION_RESULT_STEP,
  TOTAL_SITUATION_STEPS,
  useCourseGeneration,
  type PurposeChoice,
  type SituationAnswers,
  type SituationRegionValue,
  type SituationStepKey,
  type TimeRange,
} from "@/features/situation";

function updateStepParam(
  params: ReadonlyURLSearchParams,
  step: string,
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  next.set("step", step);
  return next;
}

/**
 * 상황입력 위저드 컨트롤러 (widgets/situation).
 *
 * 책임 경계:
 *   - 스텝 라우팅(?step=)과 각 스텝 답변 누적.
 *   - loading 스텝의 "제출 + 최소 노출 시간 + 결과 전환"은 useCourseGeneration(도메인 훅)에 위임하고,
 *     이 컨트롤러는 그 phase 를 받아 라우팅만 결정한다.
 *   - result 스텝의 장소 선택은 결과 화면(위젯)에 위임한다.
 *
 * @returns kind 로 분기되는 뷰 상태(step | loading | result).
 */
export function useSituationFlowController() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [answers, setAnswers] = useState<SituationAnswers>({});
  const currentStep = resolveSituationStep(params.get("step"));

  const goStep = useCallback(
    (step: string) => {
      const next = updateStepParam(params, step);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  // loading 스텝일 때만 생성(제출 + 최소 노출 시간)을 활성화한다.
  const generation = useCourseGeneration({
    answers,
    active: currentStep === SITUATION_LOADING_STEP,
  });

  // 로딩 전환 규칙:
  //   - 답변 불완전 → 처음(time)으로
  //   - phase ready(응답 완료 + 최소 시간 경과) → 결과 화면으로
  //   - phase error(제출 실패) → 목적 스텝으로 되돌림
  useEffect(() => {
    if (currentStep !== SITUATION_LOADING_STEP) {
      return;
    }
    if (!answers.time || !answers.region || !answers.purpose) {
      goStep("time");
      return;
    }
    if (generation.phase === "ready") {
      goStep(SITUATION_RESULT_STEP);
    } else if (generation.phase === "error") {
      goStep("purpose");
    }
  }, [currentStep, answers, generation.phase, goStep]);

  if (currentStep === SITUATION_LOADING_STEP) {
    return {
      kind: "loading" as const,
      answers,
    };
  }

  if (currentStep === SITUATION_RESULT_STEP) {
    return {
      kind: "result" as const,
      answers,
      // 결과 화면 뒤로가기 → 목적 스텝으로 돌아가 다시 추천받게 한다.
      handleBack: () => goStep("purpose"),
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
