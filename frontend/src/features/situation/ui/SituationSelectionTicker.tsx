"use client";

import { cn } from "@/shared/ui";

import type { SituationAnswers } from "../model";
import { useSituationSelectionTicker } from "../hooks/useSituationSelectionTicker";

export interface SituationSelectionTickerProps {
  answers: SituationAnswers;
  className?: string;
}

/**
 * situation-selection-ticker : 선택 항목이 아래→위로 올라가는 세로 캐러셀.
 * 로딩 중 "이 조건으로 만드는 중"을 보여준다. 마지막→처음은 clone 으로 매끄럽게 순환.
 */
export function SituationSelectionTicker({
  answers,
  className,
}: SituationSelectionTickerProps) {
  const { items, count, rowHeight, trackStyle } = useSituationSelectionTicker(answers);

  if (count === 0) {
    return null;
  }

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ height: rowHeight }}
      aria-live="polite"
    >
      <div style={trackStyle}>
        {items.map((chip, i) => {
          const Icon = chip.Icon;
          return (
            <div
              key={`${chip.step}-${i}`}
              className="flex items-center justify-center"
              style={{ height: rowHeight }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-subtle px-3 py-1.5 text-sm font-semibold text-text-secondary">
                <span className="text-primary">
                  <Icon size={15} />
                </span>
                {chip.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
