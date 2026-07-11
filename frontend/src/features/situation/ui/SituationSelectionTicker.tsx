"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/ui";

import type { SituationAnswers } from "../model";
import { buildSituationChips } from "./situationChips";

/** 한 행 높이(px). */
const ROW_H = 40;
/** 항목 유지 시간(ms). */
const INTERVAL = 1500;
/** 슬라이드 전환 시간(ms). */
const SLIDE = 400;

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
  const chips = buildSituationChips(answers);
  const count = chips.length;

  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  // 각 index 변화마다 다음 항목으로 진행 예약
  useEffect(() => {
    if (count <= 1) return;
    const id = setTimeout(() => setIndex((i) => i + 1), INTERVAL);
    return () => clearTimeout(id);
  }, [index, count]);

  // clone(마지막=처음) 도달 시 애니메이션 없이 0 으로 스냅
  useEffect(() => {
    if (index === count) {
      const id = setTimeout(() => {
        setAnimate(false);
        setIndex(0);
      }, SLIDE);
      return () => clearTimeout(id);
    }
    if (!animate) {
      const raf = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [index, count, animate]);

  if (count === 0) return null;

  const items = count > 1 ? [...chips, chips[0]] : chips;

  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ height: ROW_H }}
      aria-live="polite"
    >
      <div
        style={{
          transform: `translateY(-${index * ROW_H}px)`,
          transition: animate ? `transform ${SLIDE}ms ease` : "none",
        }}
      >
        {items.map((chip, i) => {
          const Icon = chip.Icon;
          return (
            <div
              key={`${chip.step}-${i}`}
              className="flex items-center justify-center"
              style={{ height: ROW_H }}
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
