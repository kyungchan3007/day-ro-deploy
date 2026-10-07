"use client";

import { useEffect, useRef } from "react";

import {
  SITUATION_LOADING_STEP,
  resolveCourseFlowFallbackStep,
  SITUATION_RESULT_STEP,
  type CourseFlowSnapshotInput,
  type PlaceCandidate,
  type SituationAnswers,
  type SituationFlowStep,
} from "@/features/situation";
import type { ToastVariant } from "@/shared/ui/toast";
import { SITUATION_FLOW_MESSAGES } from "./situation-flow-messages";

export interface UseCourseFlowRedirectsOptions {
  step: SituationFlowStep;
  rev?: string;
  /** 현재 화면 스냅샷 복원 완료 여부. */
  restoreReady: boolean;
  /** 복원 불가 시 신뢰할 수 있는 조건. 복원 불가가 아니면 null. */
  fallbackAnswers: SituationAnswers | null;
  /** 현재 조건(생성 실패 시 purpose 로 되돌릴 때 사용). */
  answers: SituationAnswers;
  /** loading 스냅샷의 operation id. */
  operationId?: string;
  /** loading 스냅샷의 operation 종류(최초 생성·재추천). */
  operationKind?: "initial" | "retry";
  /** 재추천 대상 requestId. */
  requestId?: string;
  /** 재추천 직전 결과 화면의 후보(재추천 loading 스냅샷에 함께 기록). */
  candidates: PlaceCandidate[];
  generationFailed: boolean;
  generationInterrupted: boolean;
  recordStepUrl: (input: CourseFlowSnapshotInput) => string;
  replace: (url: string) => void;
  show: (message: string, variant?: ToastVariant) => void;
}

/**
 * 상황입력 흐름의 자동 리다이렉트 훅 (widgets/situation).
 *
 * - 복원 불가: 자동 생성 없이 purpose(조건 완전) 또는 첫 미완료 단계로 replace.
 * - 최초 생성 중단·실패: 재전송하지 않고 안내 토스트 후 purpose 로 replace.
 * - 재추천 중단·실패: 보던 결과 화면(같은 requestId·후보)으로 replace(issue #143).
 *   백엔드는 실패한 재추천을 차감하지 않으므로 남은 횟수도 그대로다. purpose 로 보내면 새 코스가 만들어져
 *   남은 횟수가 초기화되고 보던 후보를 잃는다.
 * 주소(step·rev)·operation 단위로 한 번만 처리한다. 스냅샷 기록 → store 갱신 → 재렌더가
 * router 전환보다 먼저 일어나 effect 가 반복되는 것을 막는다.
 */
export function useCourseFlowRedirects({
  step,
  rev,
  restoreReady,
  fallbackAnswers,
  answers,
  operationId,
  operationKind,
  requestId,
  candidates,
  generationFailed,
  generationInterrupted,
  recordStepUrl,
  replace,
  show,
}: UseCourseFlowRedirectsOptions): void {
  const handledRedirectKey = useRef<string | null>(null);

  // 정상 복원되면 복원 실패 처리 기록을 지워, 같은 화면 안에서 같은 주소를 다시 방문해도 다시 처리되게 한다.
  useEffect(() => {
    if (restoreReady && handledRedirectKey.current?.startsWith("fallback:")) {
      handledRedirectKey.current = null;
    }
  }, [restoreReady]);

  useEffect(() => {
    if (!fallbackAnswers) {
      return;
    }
    const key = `fallback:${step}:${rev ?? ""}`;
    if (handledRedirectKey.current === key) {
      return;
    }
    handledRedirectKey.current = key;
    replace(
      recordStepUrl({
        step: resolveCourseFlowFallbackStep(fallbackAnswers),
        answers: fallbackAnswers,
        candidates: [],
        selectedPlaces: [],
      }),
    );
  }, [fallbackAnswers, recordStepUrl, replace, rev, step]);

  useEffect(() => {
    if ((!generationInterrupted && !generationFailed) || step !== SITUATION_LOADING_STEP) {
      return;
    }
    const key = `operation:${operationId ?? ""}`;
    if (handledRedirectKey.current === key) {
      return;
    }
    handledRedirectKey.current = key;

    if (operationKind === "retry" && requestId && candidates.length > 0) {
      show(
        generationFailed
          ? SITUATION_FLOW_MESSAGES.retryFailed
          : SITUATION_FLOW_MESSAGES.retryInterrupted,
        "info",
      );
      replace(
        recordStepUrl({
          step: SITUATION_RESULT_STEP,
          answers,
          requestId,
          candidates,
          selectedPlaces: [],
        }),
      );
      return;
    }

    show(
      generationFailed
        ? SITUATION_FLOW_MESSAGES.generationFailed
        : SITUATION_FLOW_MESSAGES.generationInterrupted,
      "info",
    );
    replace(
      recordStepUrl({
        step: "purpose",
        answers,
        candidates: [],
        selectedPlaces: [],
      }),
    );
  }, [
    answers,
    candidates,
    generationFailed,
    generationInterrupted,
    operationId,
    operationKind,
    recordStepUrl,
    replace,
    requestId,
    show,
    step,
  ]);
}
