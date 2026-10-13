import { cn } from "../lib";

export interface StepProgressProps {
  /** 현재 스텝(1-based). */
  current: number;
  /** 전체 스텝 수. */
  total: number;
  className?: string;
}

/**
 * step-progress : 다단계 플로우 상단 진행 표시.
 *
 * 전체폭 트랙(현재/전체 비율만큼 primary 로 채움) + 우측 "n/total" 카운터.
 * 상황입력 등 여러 스텝 화면에서 공용으로 재사용한다.
 */
export function StepProgress({ current, total, className }: StepProgressProps) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <div className={cn("w-full", className)}>
      <div
        className="h-1 w-full bg-neutral-100"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-r-full bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="px-4 pt-2 text-right text-sm font-medium text-text-muted sm:px-6">
        {current}/{total}
      </p>
    </div>
  );
}
