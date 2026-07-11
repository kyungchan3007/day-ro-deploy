"use client";

import { ChevronDownIcon, ChevronUpIcon, cn } from "@/shared/ui";

import { formatClock } from "../model";
import type { TimeField, TimeRange } from "../model";

export interface TimeRangeFieldProps {
  range: TimeRange;
  /** 현재 편집 중인 필드(강조 + 셰브론 방향). */
  activeField: TimeField;
  onSelectField: (field: TimeField) => void;
  /** 종료가 다음날이면 종료 필드에 "익일" 표시. */
  overnight?: boolean;
  className?: string;
}

const FIELD_LABEL: Record<TimeField, string> = {
  start: "시작 시간",
  end: "종료 시간",
};

const FIELDS: readonly TimeField[] = ["start", "end"] as const;

/**
 * time-range-field : 시작/종료 두 시각을 나란히 보여주는 2분할 필드.
 * 탭한 쪽이 활성(primary-surface 강조 + 셰브론 위)이 되어 아래 휠 피커의 편집 대상이 된다.
 */
export function TimeRangeField({
  range,
  activeField,
  onSelectField,
  overnight = false,
  className,
}: TimeRangeFieldProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-2xl bg-surface-subtle",
        className,
      )}
    >
      {FIELDS.map((field) => {
        const active = field === activeField;
        const time = range[field];
        const Chevron = active ? ChevronUpIcon : ChevronDownIcon;
        return (
          <button
            key={field}
            type="button"
            onClick={() => onSelectField(field)}
            aria-pressed={active}
            className={cn(
              "flex flex-col gap-1 px-4 py-3 text-left transition-colors",
              field === "end" && "border-l border-border",
              active ? "bg-primary-surface" : "hover:bg-neutral-100",
            )}
          >
            <span className="flex items-center gap-1 text-xs font-medium text-text-muted">
              {FIELD_LABEL[field]}
              {field === "end" && overnight && (
                <span className="rounded bg-primary/10 px-1 py-px text-[10px] font-semibold leading-none text-primary">
                  익일
                </span>
              )}
            </span>
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
                  {time.meridiem}
                </span>
                <span className="text-lg font-bold tabular-nums text-text-strong">
                  {formatClock(time)}
                </span>
              </span>
              <span className="text-text-muted">
                <Chevron size={18} />
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
