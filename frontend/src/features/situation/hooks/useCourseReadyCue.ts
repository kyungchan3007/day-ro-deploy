"use client";

import { useEffect, useRef, useState } from "react";

import { isReadyTransition, playReadyHaptic } from "../model/ready-cue";

export interface CourseReadyCue {
  /** 생성 중: CTA 반짝임 표시. */
  pending: boolean;
  /** 생성 중 → 완료로 바뀐 뒤: CTA 팝 1회. 처음부터 완료 상태로 열린 화면에서는 false. */
  pop: boolean;
}

/**
 * "코스 보러 가기" CTA 완료 신호 (QA #22, issue #203).
 * 완료로 바뀌는 순간 지원 기기에서 짧게 한 번 진동하고, 반짝임 · 팝 표시 여부를 돌려준다.
 */
export function useCourseReadyCue(ready: boolean): CourseReadyCue {
  const [readyOnMount] = useState(ready);
  const prevReadyRef = useRef(ready);

  useEffect(() => {
    const prev = prevReadyRef.current;
    prevReadyRef.current = ready;
    if (!isReadyTransition(prev, ready)) {
      return;
    }
    playReadyHaptic({
      vibrate: typeof navigator.vibrate === "function" ? navigator.vibrate.bind(navigator) : undefined,
      visibilityState: document.visibilityState,
    });
  }, [ready]);

  return { pending: !ready, pop: ready && !readyOnMount };
}
