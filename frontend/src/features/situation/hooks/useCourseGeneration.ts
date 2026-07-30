"use client";

import { useEffect, useRef, useState } from "react";

import type { CourseCandidateResponse } from "../../../shared/api/openapi/dayro.openapi";
import { requestCourseCandidates } from "../api/submit";
import { buildSituationRequest } from "../model/request";
import {
  MIN_LOADING_MS,
  resolveGenerationPhase,
  type GenerationApiStatus,
  type GenerationPhase,
} from "../model/course-generation";
import { saveLastGeneratedCourseCandidates } from "../lib/generated-course-storage";
import type { SituationAnswers } from "../model/types";

function isAnswersComplete(answers: SituationAnswers): boolean {
  return Boolean(answers.time && answers.region && answers.purpose);
}

export interface UseCourseGenerationResult {
  /** 로딩 화면이 취해야 할 다음 단계(pending: 유지, ready: 결과로, error: 실패 처리). */
  phase: GenerationPhase;
  /** 성공 시 코스 후보 응답(스토리지에도 저장됨). 실패/대기 중엔 null. */
  result: CourseCandidateResponse | null;
}

/**
 * 코스 생성(로딩) 훅 (features/situation).
 *
 * `active`(=loading 스텝 진입) 가 되면 situations 제출을 시작하고,
 * "최소 노출 시간(MIN_LOADING_MS)"과 "API 완료"가 모두 충족될 때 phase 를 `ready` 로 만든다.
 * 성공 응답은 기존 저장 로직(saveLastGeneratedCourseCandidates)으로 sessionStorage 에 남겨
 * 결과 화면이 재사용한다. 라우팅은 하지 않고 phase 만 알려준다(전환 판단은 상위 컨트롤러).
 *
 * @param answers 상황 입력 누적 응답(요청 조립용).
 * @param active loading 스텝 활성 여부.
 * @returns { phase, result }
 */
export function useCourseGeneration({
  answers,
  active,
}: {
  answers: SituationAnswers;
  active: boolean;
}): UseCourseGenerationResult {
  const [apiStatus, setApiStatus] = useState<GenerationApiStatus>("pending");
  const [minElapsed, setMinElapsed] = useState(false);
  const [result, setResult] = useState<CourseCandidateResponse | null>(null);

  /**
   * loading 스텝 "진입" 단위를 식별한다.
   * 같은 answers 라도 loading 화면에 다시 들어오면 새 entry 로 보고
   * 최소 1초 + 재요청 규칙을 다시 적용해야 한다.
   */
  const [entryId, setEntryId] = useState(0);
  const wasActiveRef = useRef(false);

  /**
   * loading 스텝의 false -> true 전이를 감지해 새 생성 세션을 연다.
   * 같은 입력 재진입에서도 반드시 새 entryId 가 발급되도록 answers equality 와 분리한다.
   */
  useEffect(() => {
    if (active && !wasActiveRef.current) {
      wasActiveRef.current = true;
      setApiStatus("pending");
      setMinElapsed(false);
      setResult(null);
      setEntryId((prev) => prev + 1);
      return;
    }

    if (!active && wasActiveRef.current) {
      wasActiveRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    if (!active || entryId === 0 || !isAnswersComplete(answers)) {
      return;
    }

    let cancelled = false;

    // (1) 최소 노출 시간 타이머
    const timer = setTimeout(() => {
      if (!cancelled) setMinElapsed(true);
    }, MIN_LOADING_MS);

    // (2) situations 제출(BFF 경유). 성공 시 스토리지에 저장.
    const submit = async () => {
      try {
        const response = await requestCourseCandidates(
          buildSituationRequest(answers),
        );
        if (cancelled) return;
        saveLastGeneratedCourseCandidates(response);
        setResult(response);
        setApiStatus("success");
      } catch {
        if (cancelled) return;
        setApiStatus("error");
      }
    };
    void submit();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, entryId, answers]);

  const phase = resolveGenerationPhase({
    apiStatus,
    elapsedMs: minElapsed ? MIN_LOADING_MS : 0,
  });

  return { phase, result };
}
