"use client";

import { useState } from "react";

import {
  PLACE_COUNT_MAX,
  PLACE_COUNT_MIN,
  resolvePlaceCount,
  stepPlaceCount,
} from "../model/place-count";

/**
 * 시간 스텝 장소 수 상태 (issue #247).
 *   - count: 지금 값(2~5)
 *   - decrease / increase: 한 칸씩, 끝에서는 그대로
 *   - canDecrease / canIncrease: 끝이면 false (버튼 비활성)
 */
export function usePlaceCountStep(initial?: number) {
  const [count, setCount] = useState(() => resolvePlaceCount(initial));
  return {
    count,
    decrease: () => setCount((current) => stepPlaceCount(current, -1)),
    increase: () => setCount((current) => stepPlaceCount(current, 1)),
    canDecrease: count > PLACE_COUNT_MIN,
    canIncrease: count < PLACE_COUNT_MAX,
  };
}
