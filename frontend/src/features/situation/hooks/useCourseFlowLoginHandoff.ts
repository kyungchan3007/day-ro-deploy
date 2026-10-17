"use client";

import { useCallback } from "react";

import { stashCourseFlowHandoff } from "../lib/course-flow-storage";

/**
 * 로그인으로 화면을 떠나기 직전, 현재 코스 흐름(rev 스냅샷)을 맡겨 두는 핸들러 (issue #192).
 *
 * 카카오 로그인은 새 탭 · 다른 브라우저 컨텍스트로 돌아올 수 있어, 탭 단위 저장소만으로는 복원되지 않는다.
 * 메뉴 로그인(#181)과 코스 저장 401(#169)이 같은 규칙을 쓰도록 situation 이 한 곳에서 제공한다.
 * @param rev 현재 흐름 스냅샷 rev. 없으면 맡길 흐름이 없어 아무 일도 하지 않는다.
 * @returns 맡겼으면 true.
 */
export function useCourseFlowLoginHandoff(rev: string | undefined): () => boolean {
  return useCallback(() => (rev ? stashCourseFlowHandoff(rev) : false), [rev]);
}
