"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  findCourseFlowSnapshot,
  isCourseFlowSnapshotUsable,
  type CourseFlowSnapshot,
  type CourseFlowState,
} from "../model/course-flow";
import type { SituationFlowStep } from "../model/flow";
import type { SituationAnswers } from "../model/types";
import {
  getCourseFlowState,
  subscribeCourseFlowState,
} from "../lib/course-flow-storage";

export type CourseFlowRestore =
  /** 서버 렌더·hydration 중. 저장소를 아직 읽지 않았다. */
  | { status: "restoring" }
  /** 주소(step·rev)로 화면을 그릴 수 있다. 최초 time 진입이면 snapshot 은 null. */
  | { status: "ready"; snapshot: CourseFlowSnapshot | null; retries: CourseFlowState["retries"] }
  /** 복원 불가(새 탭·만료·퇴출·단계 불일치). fallbackAnswers 로 다시 시작한다. */
  | { status: "missing"; fallbackAnswers: SituationAnswers };

// 서버·hydration 단계에서 반환하는 고정 값. 실제 상태 객체와 구분하기 위한 표식이다.
const SERVER_STATE: CourseFlowState = {
  version: 1,
  revisions: {},
  order: [],
  retries: {},
  operations: {},
};
const getServerState = () => SERVER_STATE;
// 복원 실패 시 넘기는 빈 조건. 매 렌더 새 객체를 만들면 fallback effect 가 반복 실행된다.
const EMPTY_ANSWERS: SituationAnswers = {};

/**
 * 주소의 step·rev 로 코스 만들기 화면 상태를 복원한다 (issue #129).
 * hydration 이 끝나기 전에는 restoring 을 돌려 서버·클라이언트 렌더를 일치시킨다.
 * 복원은 상태를 읽기만 하며 생성·재추천·분석 이벤트를 일으키지 않는다.
 * @param step 주소의 step.
 * @param rev 주소의 rev.
 * @returns 복원 결과.
 */
export function useCourseFlowSnapshot(
  step: SituationFlowStep,
  rev: string | undefined,
): CourseFlowRestore {
  const state = useSyncExternalStore(
    subscribeCourseFlowState,
    getCourseFlowState,
    getServerState,
  );

  return useMemo<CourseFlowRestore>(() => {
    // 최초 진입(time, rev 없음)은 저장소 없이도 결정된다 → 서버에서도 바로 그려 초기 렌더를 유지한다.
    if (!rev && step === "time") {
      return { status: "ready", snapshot: null, retries: state.retries };
    }
    if (state === SERVER_STATE) {
      return { status: "restoring" };
    }
    if (!rev) {
      return { status: "missing", fallbackAnswers: EMPTY_ANSWERS };
    }

    const snapshot = findCourseFlowSnapshot(state, rev);
    if (snapshot && isCourseFlowSnapshotUsable(step, snapshot)) {
      return { status: "ready", snapshot, retries: state.retries };
    }
    return { status: "missing", fallbackAnswers: snapshot?.answers ?? EMPTY_ANSWERS };
  }, [state, step, rev]);
}
