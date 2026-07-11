"use client";

import { useState } from "react";

import { durationMinutes, formatDuration, isOvernight } from "../model/time";
import type { Time, TimeField, TimeRange } from "../model/types";

/**
 * 시간 범위 스텝 상태.
 *   - 시작/종료 시각과 현재 편집 대상(activeField)
 *   - 활성 필드에 휠 값 반영(setActiveTime)
 *   - duration 은 오버나이트(익일) 포함. 길이 제한은 두지 않는다(유저 자유도).
 */
export function useTimeRangeStep(initial: TimeRange) {
  const [range, setRange] = useState<TimeRange>(initial);
  const [activeField, setActiveField] = useState<TimeField>("end");

  const duration = durationMinutes(range);
  const isValid = duration > 0;
  const overnight = isOvernight(range);
  const durationLabel = formatDuration(duration);

  const setActiveTime = (time: Time) =>
    setRange((prev) => ({ ...prev, [activeField]: time }));

  return {
    range,
    activeField,
    setActiveField,
    setActiveTime,
    isValid,
    duration,
    overnight,
    durationLabel,
  };
}
