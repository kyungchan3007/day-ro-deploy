"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useRestoredCourseCandidates } from "@/features/course-result";
import { useChosungQuiz } from "@/features/loading-quiz";
import { useToast, type ToastVariant } from "@/shared/ui/toast";
import {
  buildCourseRouteUrl,
  getNextSituationStep,
  getPreviousSituationStep,
  getSituationNextLabel,
  getSituationStepIndex,
  useCourseGeneration,
  SITUATION_LOADING_STEP,
  SITUATION_COURSE_STEP,
  SITUATION_RESULT_STEP,
  TOTAL_SITUATION_STEPS,
  type PlaceCandidate,
  type PurposeChoice,
  type SituationAnswers,
  type CourseCandidateResponse,
  type SituationFlowStep,
  type SituationRegionValue,
  type SituationStepKey,
  type TimeRange,
} from "@/features/situation";
import { useSituationStepGuideVisibility } from "./useSituationStepGuideVisibility";

export interface UseSituationFlowControllerOptions {
  step: SituationFlowStep;
  answers: SituationAnswers;
  candidates: PlaceCandidate[];
  selectedPlaces: PlaceCandidate[];
  candidateRequestId?: CourseCandidateResponse["data"]["requestId"];
  remainingRetries?: CourseCandidateResponse["data"]["remainingRetries"];
}

/**
 * 상황입력 위저드 컨트롤러 (widgets/situation).
 *
 * 책임 경계:
 *   - 서버가 해석해 내려준 URL 상태(step/answers/candidates)를 기준으로 화면 분기를 결정한다.
 *   - 각 스텝 완료 시 다음 URL을 만들고 router.push 한다.
 *   - result/course 단계의 데이터 fetch 자체는 서버 page가 담당하고, 이 컨트롤러는 라우팅만 맡는다.
 *
 * @returns kind 로 분기되는 뷰 상태(step | loading | result | course).
 */
export function useSituationFlowController({
  step,
  answers,
  candidates,
  selectedPlaces,
  candidateRequestId,
  remainingRetries,
}: UseSituationFlowControllerOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quiz = useChosungQuiz();
  const { toast, visible, show } = useToast();
  const stepGuideVisible = useSituationStepGuideVisibility({
    step,
    hasExplicitStep: searchParams.has("step"),
  });
  const previousRemainingRetries = useRef<number | undefined>(undefined);
  const {
    places: resultCandidates,
    requestId: resultRequestId,
    remainingRetries: resultRemainingRetries,
  } = useRestoredCourseCandidates({
    active: step === SITUATION_RESULT_STEP,
    candidates,
    requestId: candidateRequestId,
    remainingRetries,
  });
  const retryKey =
    step === SITUATION_LOADING_STEP
      ? searchParams.get("retry") ?? undefined
      : undefined;

  /**
   * 로딩 화면에서 실제 코스 생성을 미리 수행한다(백엔드 캐시 워밍 + 완료 시점 파악).
   * 결과/지도의 데이터 소스는 여전히 서버 page이며, 여기서는 "언제 준비됐는지"만 본다.
   * generation 성공 완료(ready)일 때만 "코스 보러 가기" CTA 를 노출한다.
   */
  const generation = useCourseGeneration({
    answers,
    active: step === SITUATION_LOADING_STEP,
    requestId: candidateRequestId,
    retryKey,
  });
  const loadingReady = generation.phase === "ready";

  const buildStepUrl = useCallback(
    (
      nextStep: SituationFlowStep,
      nextAnswers: SituationAnswers = answers,
      options?: {
        requestId?: string;
        retryKey?: string;
        selectedPlaceIds?: readonly string[];
        selectedPlaces?: readonly PlaceCandidate[];
        candidatePlaces?: readonly PlaceCandidate[];
      },
    ) => {
      return buildCourseRouteUrl({
        step: nextStep,
        answers: nextAnswers,
        requestId: options?.requestId,
        retryKey: options?.retryKey,
        selectedPlaceIds: options?.selectedPlaceIds,
        selectedPlaces: options?.selectedPlaces,
        candidatePlaces: options?.candidatePlaces,
      });
    },
    [answers],
  );

  const goStep = useCallback(
    (
      nextStep: SituationFlowStep,
      nextAnswers: SituationAnswers = answers,
      options?: {
        requestId?: string;
        retryKey?: string;
        selectedPlaceIds?: readonly string[];
        selectedPlaces?: readonly PlaceCandidate[];
        candidatePlaces?: readonly PlaceCandidate[];
      },
    ) => {
      router.push(buildStepUrl(nextStep, nextAnswers, options));
    },
    [answers, buildStepUrl, router],
  );

  const goToResult = useCallback(
    (options?: {
      requestId?: string;
      candidatePlaces?: readonly PlaceCandidate[];
    }) => {
      router.replace(
        buildStepUrl(SITUATION_RESULT_STEP, answers, {
          requestId: options?.requestId,
          candidatePlaces: options?.candidatePlaces,
        }),
      );
    },
    [answers, buildStepUrl, router],
  );

  useEffect(() => {
    if (step !== SITUATION_RESULT_STEP) {
      previousRemainingRetries.current = resultRemainingRetries;
      return;
    }

    if (
      resultRemainingRetries === 0 &&
      previousRemainingRetries.current !== 0
    ) {
      show("다른 코스 보기를 모두 사용했어요.", "info");
    }

    previousRemainingRetries.current = resultRemainingRetries;
  }, [resultRemainingRetries, show, step]);

  if (step === SITUATION_LOADING_STEP) {
    return {
      kind: "loading" as const,
      answers,
      // 로딩 준비 완료 여부와 결과 이동 핸들러(CTA용).
      ready: loadingReady,
      onViewCourse: () =>
        goToResult({
          requestId: generation.result?.data.requestId,
          candidatePlaces: generation.result?.data.places,
        }),
      quiz,
    };
  }

  if (step === SITUATION_RESULT_STEP) {
    return {
      kind: "result" as const,
      answers,
      candidates: resultCandidates,
      requestId: resultRequestId,
      remainingRetries: resultRemainingRetries,
      toastVisible: visible,
      toastMessage: toast?.message ?? null,
      toastVariant: toast?.variant ?? (null as ToastVariant | null),
      // 결과 화면 뒤로가기 → 목적 스텝으로 돌아가 다시 추천받게 한다.
      handleBack: () => goStep("purpose"),
      handleReroll: () =>
        goStep(SITUATION_LOADING_STEP, answers, {
          requestId: resultRequestId,
          retryKey: String(Date.now()),
        }),
      // 선택완료 → 확정 코스(지도) 화면으로 전환. 선택된 장소는 URL query에 실어 서버가 다시 읽게 한다.
      handleComplete: (places: PlaceCandidate[]) =>
        goStep(SITUATION_COURSE_STEP, answers, {
          requestId: resultRequestId,
          selectedPlaceIds: places.map((place) => place.placeId),
          selectedPlaces: places,
          candidatePlaces: resultCandidates,
        }),
    };
  }

  if (step === SITUATION_COURSE_STEP) {
    return {
      kind: "course" as const,
      answers,
      selectedPlaces,
      candidates,
      requestId: candidateRequestId,
      // 코스 화면 뒤로가기 → 결과(선택) 화면으로 돌아간다.
      handleBack: () =>
        goStep(SITUATION_RESULT_STEP, answers, {
          requestId: candidateRequestId,
          candidatePlaces: candidates,
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
    goStep(SITUATION_LOADING_STEP, { ...answers, purpose });
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
    handleBack,
    editStep,
    setTime,
    setRegion,
    setPurpose,
  };
}
