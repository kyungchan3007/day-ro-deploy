import { cn } from "../lib";
import { TRANSPORT_META, type TransportMode } from "./constants";

export interface TransportLabelProps {
  mode: TransportMode;
  /** 소요 시간(분). 지정 시 "라벨 N분" 형태로 표기. */
  minutes?: number | string;
  className?: string;
}

/**
 * label-transport-floating : 지도 위 플로팅 이동수단 칩.
 * 예) 🚶 도보 5분
 */
export function TransportLabel({ mode, minutes, className }: TransportLabelProps) {
  const meta = TRANSPORT_META[mode];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border border-border bg-surface px-2 py-1 text-[11px] font-medium text-text-secondary shadow-sm",
        className,
      )}
    >
      {Icon && <Icon size={13} style={{ color: meta.colorVar }} />}
      <span>
        {meta.label}
        {minutes != null && ` ${minutes}분`}
      </span>
    </span>
  );
}
