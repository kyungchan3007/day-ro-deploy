"use client";

import { useMemo } from "react";

import type {
  PlaceCandidate,
} from "../../../shared/api/openapi/dayro.openapi";

export interface UseCourseResultOptions {
  /** 서버가 준비한 현재 후보 목록. */
  candidates: PlaceCandidate[];
}

export interface UseCourseResultValue {
  /** 결과 화면이 렌더할 현재 후보 목록. */
  candidates: PlaceCandidate[];
  /** 표시할 후보가 비어 있는지. */
  isEmpty: boolean;
}

/**
 * 결과 화면 상태 훅 (features/course-result).
 *
 * 서버가 URL 기반으로 준비한 후보 목록을 화면 친화적인 값으로 노출한다.
 * 결과 재생성 자체는 라우트 이동으로 다시 서버가 수행하므로, 이 훅은 읽기 전용 파생 상태만 맡는다.
 *
 * @param options.candidates 현재 라우트가 준비한 후보 목록.
 * @returns 결과 화면이 소비할 후보/파생 상태.
 */
export function useCourseResult({
  candidates,
}: UseCourseResultOptions): UseCourseResultValue {
  const isEmpty = useMemo(() => candidates.length === 0, [candidates]);

  return {
    candidates,
    isEmpty,
  };
}
