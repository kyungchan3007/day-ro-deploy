"use client";

import { cn } from "@/shared/ui";
import { useWheelColumn } from "../hooks/useWheelColumn";

export interface WheelColumnProps<T extends string | number> {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  /** 표시용 포맷(예: 분 2자리). 기본은 값 그대로. */
  format?: (value: T) => string;
  ariaLabel?: string;
  className?: string;
}

/**
 * wheel-column : scroll-snap 기반 드럼 휠 한 컬럼.
 *
 * 입력 방식:
 *   - 모바일 터치 / 마우스 휠 / 트랙패드 → 네이티브 스크롤(scroll-snap)
 *   - 데스크탑 마우스 → 잡고 위아래로 끄는 포인터 드래그(터치·펜은 네이티브 유지)
 *   - 키보드 → 포커스 후 방향키 스크롤
 *
 * 스크롤이 멎으면 가운데 항목 인덱스를 읽어 onChange 로 올리고,
 * 외부 value 변경 시 해당 위치로 정렬한다.
 */
export function WheelColumn<T extends string | number>({
  items,
  value,
  onChange,
  format,
  ariaLabel,
  className,
}: WheelColumnProps<T>) {
  const { ref, pad, containerHandlers } = useWheelColumn({
    items,
    value,
    onChange,
  });

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      {...containerHandlers}
      className={cn(
        "snap-y snap-mandatory overflow-y-auto overscroll-contain",
        "h-[120px] cursor-grab touch-pan-y select-none active:cursor-grabbing",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <div style={{ height: pad }} aria-hidden />
      {items.map((item) => {
        const selected = item === value;
        return (
          <div
            key={String(item)}
            role="option"
            aria-selected={selected}
            className={cn(
              "flex h-10 snap-center items-center justify-center text-lg tabular-nums transition-colors",
              selected ? "font-bold text-text-strong" : "text-neutral-300",
            )}
          >
            {format ? format(item) : item}
          </div>
        );
      })}
      <div style={{ height: pad }} aria-hidden />
    </div>
  );
}
