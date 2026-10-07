"use client";

import { useEffect, useState } from "react";
import { trackGenerationSuccess } from "../model/generation-analytics";

import type { CourseCandidateResponse } from "../../../shared/api/openapi/dayro.openapi";
import {
  requestCourseCandidates,
  requestRetriedCourseCandidates,
} from "../api/submit";
import { buildSituationRequest } from "../model/request";
import {
  MIN_LOADING_MS,
  resolveGenerationPhase,
  type GenerationApiStatus,
  type GenerationPhase,
} from "../model/course-generation";
import {
  setCourseFlowOperation,
  setCourseFlowRemainingRetries,
  type CourseFlowOperationRef,
} from "../model/course-flow";
import {
  getCourseFlowState,
  updateCourseFlowState,
} from "../lib/course-flow-storage";
import type { SituationAnswers } from "../model/types";

/**
 * 같은 문서 안에서 진행 중인 생성·재추천 요청(operation id → Promise).
 * 화면을 벗어났다가 돌아오거나 StrictMode 로 effect 가 다시 실행돼도 새 요청 없이 이어 붙인다.
 * 새로고침되면 비워지므로, 저장소에는 pending 인데 여기 없으면 "실행 주체를 잃은" 요청이다.
 */
const liveOperations = new Map<string, Promise<CourseCandidateResponse>>();

function isAnswersComplete(answers: SituationAnswers): boolean {
  return Boolean(answers.time && answers.region && answers.purpose);
}

export interface UseCourseGenerationResult {
  /** 로딩 화면이 취해야 할 다음 단계(pending: 유지, ready: 결과로, error: 실패 처리). */
  phase: GenerationPhase;
  /** 성공 시 코스 후보 응답. 실패/대기 중엔 null. */
  result: CourseCandidateResponse | null;
  /** 새로고침 등으로 진행 중 요청의 결과를 확인할 수 없게 됐으면 true(자동 재전송하지 않는다). */
  interrupted: boolean;
}

/**
 * operation 1회를 시작하거나 이어 붙인다. 성공 응답·잔여 횟수는 흐름 상태에 기록한다.
 * @param operation 수행할 요청.
 * @param answers 최초 생성 요청 조립용 조건.
 * @returns 요청 Promise.
 */
function runOperation(
  operation: CourseFlowOperationRef,
  answers: SituationAnswers,
): Promise<CourseCandidateResponse> {
  const live = liveOperations.get(operation.id);
  if (live) {
    return live;
  }

  updateCourseFlowState((state) =>
    setCourseFlowOperation(state, operation.id, { status: "pending" }),
  );

  const request =
    operation.kind === "retry" && operation.requestId
      ? requestRetriedCourseCandidates(operation.requestId)
      : requestCourseCandidates(buildSituationRequest(answers));

  const promise = request.then((response) => {
    trackGenerationSuccess(response, answers, operation.kind === "retry");
    updateCourseFlowState((state) =>
      setCourseFlowRemainingRetries(
        setCourseFlowOperation(state, operation.id, { status: "done", response }),
        response.data.requestId,
        response.data.remainingRetries,
      ),
    );
    return response;
  });
  // 실패는 기록해 두어, 새로고침 후에도 "결과 확인 불가"가 아니라 실패로 안내한다.
  promise.catch(() => {
    liveOperations.delete(operation.id);
    updateCourseFlowState((state) =>
      setCourseFlowOperation(state, operation.id, { status: "failed" }),
    );
  });
  liveOperations.set(operation.id, promise);
  return promise;
}

/**
 * 코스 생성(로딩) 훅 (features/situation).
 *
 * loading 스냅샷의 operation 을 기준으로 생성·재추천을 수행한다(issue #129).
 * - 이미 완료된 operation: 저장된 응답으로 즉시 ready(새 요청 없음)
 * - 같은 문서에서 진행 중: 기존 Promise 에 다시 연결
 * - 저장소엔 pending 인데 진행 중 Promise 가 없음: interrupted(자동 재전송 금지)
 * - 실패로 기록된 operation: error(자동 재전송 금지)
 * - 처음 보는 operation: 요청 시작
 * "최소 노출 시간(MIN_LOADING_MS)"과 "API 완료"가 모두 충족될 때 phase 를 ready 로 만든다.
 * 라우팅은 하지 않고 상태만 알려준다(전환 판단은 상위 컨트롤러).
 *
 * @param answers loading 스냅샷의 조건.
 * @param active loading 화면이 복원 완료 상태로 활성인지.
 * @param operation loading 스냅샷의 operation.
 */
export function useCourseGeneration({
  answers,
  active,
  operation,
}: {
  answers: SituationAnswers;
  active: boolean;
  operation?: CourseFlowOperationRef;
}): UseCourseGenerationResult {
  const [apiStatus, setApiStatus] = useState<GenerationApiStatus>("pending");
  const [minElapsed, setMinElapsed] = useState(false);
  const [result, setResult] = useState<CourseCandidateResponse | null>(null);
  const [interrupted, setInterrupted] = useState(false);
  const operationId = operation?.id;
  const operationKind = operation?.kind;
  const operationRequestId = operation?.requestId;

  // 다른 operation(새 loading 화면)으로 바뀌면 렌더 중에 표시 상태를 초기화한다.
  const [trackedOperationId, setTrackedOperationId] = useState(operationId);
  if (trackedOperationId !== operationId) {
    setTrackedOperationId(operationId);
    setApiStatus("pending");
    setMinElapsed(false);
    setResult(null);
    setInterrupted(false);
  }

  useEffect(() => {
    if (!active || !operationId || !operationKind || !isAnswersComplete(answers)) {
      return;
    }

    const currentOperation: CourseFlowOperationRef = {
      id: operationId,
      kind: operationKind,
      requestId: operationRequestId,
    };
    let cancelled = false;

    const record = getCourseFlowState().operations[operationId];
    if (record?.status === "done" && record.response) {
      // 완료된 operation 으로 돌아온 경우: 저장된 응답을 그대로 쓴다.
      const doneResponse = record.response;
      queueMicrotask(() => {
        if (cancelled) return;
        setResult(doneResponse);
        setApiStatus("success");
        setMinElapsed(true);
      });
      return () => {
        cancelled = true;
      };
    }
    if (record?.status === "failed") {
      queueMicrotask(() => {
        if (!cancelled) setApiStatus("error");
      });
      return () => {
        cancelled = true;
      };
    }
    if (record?.status === "pending" && !liveOperations.has(operationId)) {
      queueMicrotask(() => {
        if (!cancelled) setInterrupted(true);
      });
      return () => {
        cancelled = true;
      };
    }

    // (1) 최소 노출 시간 타이머
    const timer = setTimeout(() => {
      if (!cancelled) setMinElapsed(true);
    }, MIN_LOADING_MS);

    // (2) 생성·재추천(BFF 경유). 응답은 이 operation 을 보고 있는 동안에만 화면에 반영한다.
    runOperation(currentOperation, answers).then(
      (response) => {
        if (cancelled) return;
        setResult(response);
        setApiStatus("success");
      },
      () => {
        if (cancelled) return;
        setApiStatus("error");
      },
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, operationId, operationKind, operationRequestId, answers]);

  const phase = resolveGenerationPhase({
    apiStatus,
    elapsedMs: minElapsed ? MIN_LOADING_MS : 0,
  });

  return { phase, result, interrupted };
}
