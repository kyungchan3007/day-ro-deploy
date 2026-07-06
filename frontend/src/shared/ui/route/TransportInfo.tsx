import { cn } from "../lib";
import { TRANSPORT_META, type TransportMode } from "./constants";

export interface TransportInfoProps {
  mode: TransportMode;
  minutes?: number | string;
  className?: string;
}

/**
 * transport-info : 이동 정보 한 줄.
 * 예) 🚶 이동 : (도보) N분
 */
export function TransportInfo({ mode, minutes = "N", className }: TransportInfoProps) {
  const meta = TRANSPORT_META[mode];
  const Icon = meta.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] text-text-secondary",
        className,
      )}
    >
      {Icon && <Icon size={13} style={{ color: meta.colorVar }} />}
      <span>
        이동 : ({meta.label}) {minutes}분
      </span>
    </span>
  );
}
