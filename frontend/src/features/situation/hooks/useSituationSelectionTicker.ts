"use client";

import { useEffect, useMemo, useState } from "react";
import type { SituationAnswers } from "../model";
import { buildSituationChips } from "../ui/situationChips";

const ROW_H = 40;
const INTERVAL = 1500;
const SLIDE = 400;

/**
 * 로딩 티커 상태/애니메이션 훅.
 */
export function useSituationSelectionTicker(answers: SituationAnswers) {
  const chips = useMemo(() => buildSituationChips(answers), [answers]);
  const count = chips.length;
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    if (count <= 1) {
      return;
    }
    const id = setTimeout(() => setIndex((prev) => prev + 1), INTERVAL);
    return () => clearTimeout(id);
  }, [count, index]);

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
  }, [animate, count, index]);

  const items = useMemo(
    () => (count > 1 ? [...chips, chips[0]] : chips),
    [chips, count],
  );

  return {
    items,
    count,
    rowHeight: ROW_H,
    index,
    trackStyle: {
      transform: `translateY(-${index * ROW_H}px)`,
      transition: animate ? `transform ${SLIDE}ms ease` : "none",
    },
  };
}
