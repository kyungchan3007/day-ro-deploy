"use client";

import { cn } from "@/shared/ui";

import type { SituationAnswers, SituationStepKey } from "../model";
import { buildSituationChips } from "./situationChips";

export interface SituationSummaryProps {
  answers: SituationAnswers;
  /** 현재 편집 중인 스텝(자기 칩은 숨긴다). */
  currentStep?: SituationStepKey;
  /** 칩 탭 → 해당 스텝으로 되돌아가 수정. */
  onEdit: (step: SituationStepKey) => void;
  className?: string;
}

/**
 * situation-summary : 지금까지 고른 값을 칩으로 보여주는 누적 요약 바.
 * 각 칩을 탭하면 그 스텝으로 돌아가 수정한다. 표시할 값이 없으면 렌더하지 않는다.
 */
export function SituationSummary({
  answers,
  currentStep,
  onEdit,
  className,
}: SituationSummaryProps) {
  const visible = buildSituationChips(answers).filter(
    (chip) => chip.step !== currentStep,
  );
  if (visible.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {visible.map(({ step, Icon, label }) => (
        <button
          key={step}
          type="button"
          onClick={() => onEdit(step)}
          aria-label={`${label} 수정`}
          className="inline-flex items-center gap-1 rounded-pill border border-border bg-surface-subtle px-2.5 py-1 text-xs font-medium text-text-tertiary transition-colors hover:bg-border"
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}
