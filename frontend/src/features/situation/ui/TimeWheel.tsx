"use client";

import { cn } from "@/shared/ui";

import { HOURS, MERIDIEMS, MINUTES, pad2 } from "../model";
import type { Time } from "../model";
import { WheelColumn } from "./WheelColumn";

export interface TimeWheelProps {
  value: Time;
  onChange: (value: Time) => void;
  className?: string;
}

/**
 * time-wheel : 오전오후 / 시 / 분 3컬럼 드럼 피커.
 * 가운데 선택 행을 보라 테두리 박스로 강조한다(WHEEL_ITEM_HEIGHT 와 정렬).
 */
export function TimeWheel({ value, onChange, className }: TimeWheelProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-surface-subtle px-4 py-2",
        className,
      )}
    >
      {/* 선택 하이라이트(가운데 행) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-1/2 z-0 h-10 -translate-y-1/2 rounded-xl border border-primary bg-surface"
      />

      <div className="relative z-10 grid grid-cols-3">
        <WheelColumn
          ariaLabel="오전 오후"
          items={MERIDIEMS}
          value={value.meridiem}
          onChange={(meridiem) => onChange({ ...value, meridiem })}
        />
        <WheelColumn
          ariaLabel="시"
          items={HOURS}
          value={value.hour}
          onChange={(hour) => onChange({ ...value, hour })}
        />
        <WheelColumn
          ariaLabel="분"
          items={MINUTES}
          value={value.minute}
          onChange={(minute) => onChange({ ...value, minute })}
          format={pad2}
        />
      </div>
    </div>
  );
}
