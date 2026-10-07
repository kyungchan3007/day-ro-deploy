import { cn } from "../lib";

export interface RouteSummaryProps {
  /** 앞 라벨. 기본 "총 이동시간". */
  label?: string;
  /** 값. 예: "N" → "총 이동시간 N분". */
  value?: number | string;
  /** 값 뒤 단위. 기본 "분". */
  unit?: string;
  className?: string;
}

/**
 * info-summary : 요약 pill (총 이동시간 N분).
 */
export function RouteSummary({
  label = "총 이동시간",
  value = "N",
  unit = "분",
  className,
}: RouteSummaryProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-pill bg-surface-subtle px-4 py-2 text-[13px] font-medium text-text-secondary",
        className,
      )}
    >
      {label} {value}
      {unit}
    </span>
  );
}
