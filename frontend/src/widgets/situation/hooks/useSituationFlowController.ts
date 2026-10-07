"use client";

import { trackEvent } from "@/shared/analytics";

import { useSearchParams } from "next/navigation";

import { useChosungQuiz } from "@/features/loading-quiz";
import { useToast, type ToastVariant } from "@/shared/ui/toast";
import {
  COURSE_RETRY_LIMIT,
  createCourseFlowOperationId,
  getNextSituationStep,
  getPreviousSituationStep,
  getSituationNextLabel,
  getSituationStepIndex,
  useCourseFlowSnapshot,
  useCourseGeneration,
  SITUATION_LOADING_STEP,
  SITUATION_COURSE_STEP,
  SITUATION_RESULT_STEP,
  TOTAL_SITUATION_STEPS,
  type PlaceCandidate,
  type PurposeChoice,
  type SituationAnswers,
  type SituationFlowStep,
  type SituationRegionValue,
  type SituationStepKey,
  type TimeRange,
} from "@/features/situation";
import { SITUATION_FLOW_MESSAGES } from "./situation-flow-messages";
import { useCourseFlowNavigation } from "./useCourseFlowNavigation";
import { useCourseFlowRedirects } from "./useCourseFlowRedirects";
import { useRetryExhaustedNotice } from "./useRetryExhaustedNotice";
import { useSituationStepGuideVisibility } from "./useSituationStepGuideVisibility";

const EMPTY_ANSWERS: SituationAnswers = {};
const EMPTY_PLACES: PlaceCandidate[] = [];

export interface UseSituationFlowControllerOptions {
  step: SituationFlowStep;
  /** 주소의 화면 상태 스냅샷 키. 조건·후보는 흐름 상태에서 복원한다. */
  rev?: string;
}

/**
 * 상황입력 위저드 컨트롤러 (widgets/situation).
 *
 * 책임 경계(issue #129, #133):
 *   - 주소의 step·rev 로 흐름 상태 스냅샷을 복원해 화면 분기(kind)와 단계별 액션을 조합한다.
 *   - 화면 이동(스냅샷 기록 + `?step=&rev=`)은 useCourseFlowNavigation 이 맡는다.
 *   - 복원 불가·생성 실패 리다이렉트는 useCourseFlowRedirects, 소진 안내는 useRetryExhaustedNotice 가 맡는다.
 *   - 생성·재추천은 loading 스냅샷의 operation 으로만 시작한다(조회·복원은 생성하지 않음).
 *
 * @returns kind 로 분기되는 뷰 상태(restoring | step | loading | result | course).
 */
export function useSituationFlowController({
  step,
  rev,
}: UseSituationFlowControllerOptions) {
  const searchParams = useSearchParams();
  const quiz = useChosungQuiz();
  const { toast, visible, show } = useToast();
  const stepGuideVisible = useSituationStepGuideVisibility({
    step,
    hasExplicitStep: searchParams.has("step"),
  });
  const restore = useCourseFlowSnapshot(step, rev);
  const snapshot = restore.status === "ready" ? restore.snapshot : null;
  const answers = snapshot?.answers ?? EMPTY_ANSWERS;
  const candidates = snapshot?.candidates ?? EMPTY_PLACES;
  const selectedPlaces = snapshot?.selectedPlaces ?? EMPTY_PLACES;
  const requestId = snapshot?.requestId;
  const remainingRetries =
    restore.status === "ready" && requestId != null ? restore.retries[requestId] : undefined;

  /**
   * 로딩 화면에서 loading 스냅샷의 operation(최초 생성 또는 재추천)을 수행한다.
   * 복원이 끝난 loading 화면에서만 활성화한다.
   */
  const generation = useCourseGeneration({
    answers,
    active: restore.status === "ready" && step === SITUATION_LOADING_STEP,
    operation: snapshot?.operation,
  });
  const loadingReady = generation.phase === "ready";
  const { router, recordStepUrl, goStep } = useCourseFlowNavigation({ rev, answers });

  useCourseFlowRedirects({
    step,
    rev,
    restoreReady: restore.status === "ready",
    fallbackAnswers: restore.status === "missing" ? restore.fallbackAnswers : null,
    answers,
    operationId: snapshot?.operation?.id,
    operationKind: snapshot?.operation?.kind,
    requestId,
    candidates,
    generationFailed: generation.phase === "error",
    generationInterrupted: generation.interrupted,
    recordStepUrl,
    replace: router.replace,
    show,
  });
  useRetryExhaustedNotice({ step, remainingRetries, show });

  const toastState = {
    toastVisible: visible,
    toastMessage: toast?.message ?? null,
    toastVariant: toast?.variant ?? (null as ToastVariant | null),
  };

  if (restore.status !== "ready") {
    return { kind: "restoring" as const, ...toastState };
  }

  if (step === SITUATION_LOADING_STEP) {
    return {
      kind: "loading" as const,
      answers,
      // 로딩 준비 완료 여부와 결과 이동 핸들러(CTA용).
      ready: loadingReady,
      onViewCourse: () => {
        const response = generation.result;
        if (!response) {
          return;
        }
        router.replace(
          recordStepUrl({
            step: SITUATION_RESULT_STEP,
            answers,
            requestId: response.data.requestId,
            candidates: response.data.places,
            selectedPlaces: [],
          }),
        );
      },
      quiz,
    };
  }

  if (step === SITUATION_RESULT_STEP) {
    // 잔여 횟수가 0 이하면 재추천 대신 안내만 한다(서버 retry 한도 정책과 동일 기준).
    const retryExhausted = remainingRetries != null && remainingRetries <= 0;

    return {
      kind: "result" as const,
      answers,
      candidates,
      requestId,
      remainingRetries,
      retryExhausted,
      ...toastState,
      // 결과 화면 뒤로가기 → 목적 스텝으로 돌아가 다시 추천받게 한다.
      handleBack: () => goStep("purpose"),
      // 한도 소진 시 재추천하지 않고 안내 토스트만 띄운다.
      handleReroll: () => {
        if (retryExhausted) {
          trackEvent("course_retry_limit_reached", { retry_limit: COURSE_RETRY_LIMIT });
          show(SITUATION_FLOW_MESSAGES.retryExhausted, "info");
          return;
        }

        // 재추천이 실패하면 이 후보로 결과 화면을 되돌릴 수 있게 loading 스냅샷에 함께 기록한다(issue #143).
        goStep(SITUATION_LOADING_STEP, answers, {
          requestId,
          candidates,
          operation: { id: createCourseFlowOperationId(), kind: "retry", requestId },
        });
      },
      // 선택완료 → 확정 코스(지도) 화면. 선택·후보는 흐름 상태 스냅샷에 담는다.
      handleComplete: (places: PlaceCandidate[]) =>
        goStep(SITUATION_COURSE_STEP, answers, {
          requestId,
          candidates,
          selectedPlaces: places,
        }),
    };
  }

  if (step === SITUATION_COURSE_STEP) {
    return {
      kind: "course" as const,
      answers,
      selectedPlaces,
      candidates,
      requestId,
      // 코스 화면 뒤로가기 → 결과(선택) 화면으로 돌아간다.
      handleBack: () =>
        goStep(SITUATION_RESULT_STEP, answers, {
          requestId,
          candidates,
        }),
    };
  }

  const activeStep = step as SituationStepKey;
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
    if (nextStep) {
      goStep(nextStep, { ...answers, time });
    }
  };

  const setRegion = (region: SituationRegionValue) => {
    if (nextStep) {
      goStep(nextStep, { ...answers, region });
    }
  };

  const setPurpose = (purpose: PurposeChoice) => {
    goStep(SITUATION_LOADING_STEP, { ...answers, purpose }, {
      operation: { id: createCourseFlowOperationId(), kind: "initial" },
    });
  };

  /** 요약 칩에서 특정 스텝으로 되돌아가 수정. */
  const editStep = (step: SituationStepKey) => goStep(step);

  return {
    kind: "step" as const,
    currentStep: activeStep,
    stepGuideVisible,
    stepNumber: stepIndex + 1,
    totalSteps: TOTAL_SITUATION_STEPS,
    nextLabel: getSituationNextLabel(activeStep),
    answers,
    ...toastState,
    handleBack,
    editStep,
    setTime,
    setRegion,
    setPurpose,
  };
}
