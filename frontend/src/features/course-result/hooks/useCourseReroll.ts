"use client";

import { useTransition } from "react";

export interface UseCourseRerollOptions {
  /** 잔여 횟수 소진 여부. true면 선택을 유지한 채 상위 핸들러에 안내만 위임한다. */
  exhausted: boolean;
  /** 재추천 시작 직전에 현재 선택을 비운다. */
  resetSelection: () => void;
  /** 상위 flow 의 재추천(또는 소진 안내) 핸들러. */
  onReroll?: () => void;
}

/**
 * 다른 코스 보기 client orchestration (features/course-result).
 *
 * - 진행 중이면 중복 요청을 막는다.
 * - 소진 상태면 선택 초기화·transition 없이 상위에 위임해 안내만 받게 한다.
 * - 그 외에는 선택을 비우고 transition 안에서 상위 재추천 라우팅을 실행한다.
 */
export function useCourseReroll({
  exhausted,
  resetSelection,
  onReroll,
}: UseCourseRerollOptions) {
  const [rerolling, startRerollTransition] = useTransition();

  const handleReroll = () => {
    if (rerolling) {
      return;
    }

    if (exhausted) {
      onReroll?.();
      return;
    }

    resetSelection();
    startRerollTransition(() => {
      onReroll?.();
    });
  };

  return { rerolling, handleReroll };
}
