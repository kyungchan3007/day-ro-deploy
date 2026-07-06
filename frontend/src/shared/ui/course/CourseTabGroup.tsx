"use client";

import { cn, useControllableState } from "../lib";

export interface CourseTabOption {
  value: string;
  /** 메인 라벨. 예: "A course". */
  label: string;
  /** 보조 라벨. 예: "최단 거리". */
  sublabel?: string;
  disabled?: boolean;
}

export interface CourseTabGroupProps {
  options: CourseTabOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * tap-course-btn-group : 코스 선택 세그먼트.
 * controlled/uncontrolled 모두 지원(헤드리스). 선택 상태만 관리하고
 * 스타일은 토큰으로 처리한다.
 */
export function CourseTabGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  className,
}: CourseTabGroupProps) {
  const [selected, setSelected] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? options[0]?.value,
    onChange: onValueChange,
  });

  return (
    <div role="tablist" className={cn("inline-flex items-center gap-2", className)}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={opt.disabled}
            onClick={() => setSelected(opt.value)}
            className={cn(
              "flex min-w-[72px] flex-col items-center justify-center rounded-lg border px-3 py-2 transition-colors",
              "disabled:pointer-events-none disabled:opacity-40",
              active
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-strong hover:bg-surface-subtle",
            )}
          >
            <span className="text-[13px] font-bold leading-tight">{opt.label}</span>
            {opt.sublabel && (
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  active ? "text-white/80" : "text-text-muted",
                )}
              >
                {opt.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
