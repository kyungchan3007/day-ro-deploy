"use client";

import { Button, type ButtonVariant } from "@/shared/ui/button";
import { RefreshIcon } from "@/shared/ui/icon";
import { courseResultStatic } from "@/shared/static/course-result";

export interface RerollButtonProps {
  /** 헤더(다른 코스 보기)는 primary, 빈 상태(다시 추천받기)는 secondary. */
  variant: ButtonVariant;
  /** 기본 문구. 진행 중에는 "다시 받는 중…" 으로 바뀐다. */
  label: string;
  onClick: () => void;
  /** 재요청 진행 중. 버튼을 막고 aria-busy 로 알린다. */
  rerolling: boolean;
  /** 잔여 횟수 소진. 클릭은 받되(안내 토스트) aria-disabled 로 흐리게 보인다. */
  exhausted: boolean;
}

/**
 * 결과 화면 재추천 버튼 (widgets/course-result 내부 조각, issue #229).
 * 헤더 "다른 코스 보기" 와 빈 상태 "다시 추천받기" 의 중복 마크업을 합쳤다.
 */
export function RerollButton({ variant, label, onClick, rerolling, exhausted }: RerollButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      disabled={rerolling}
      aria-disabled={exhausted || undefined}
      aria-busy={rerolling}
      // 소진 상태는 disabled 와 같은 흐린 시각을 쓰되, 클릭해 안내를 받을 수 있게 둔다.
      className="aria-disabled:opacity-40"
      leftIcon={<RefreshIcon size={15} />}
    >
      {rerolling ? courseResultStatic.rerollingLabel : label}
    </Button>
  );
}
