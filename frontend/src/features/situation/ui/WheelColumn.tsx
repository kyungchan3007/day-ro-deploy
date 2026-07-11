"use client";

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/shared/ui";

/** 한 행 높이(px). TimeWheel 의 선택 하이라이트와 반드시 일치시킬 것. */
export const WHEEL_ITEM_HEIGHT = 40;
/** 보이는 행 수(홀수). 3 → 위/가운데(선택)/아래. */
const VISIBLE_ROWS = 3;
/** 첫/마지막 항목도 가운데로 올 수 있도록 위아래 스페이서. */
const PAD = WHEEL_ITEM_HEIGHT * ((VISIBLE_ROWS - 1) / 2);

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
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ startY: number; startTop: number } | null>(null);

  // 외부 value 변경 → 해당 항목을 가운데로 정렬
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, items.indexOf(value));
    if (Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT) !== idx) {
      el.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT });
    }
  }, [value, items]);

  const nearestIndex = (scrollTop: number) =>
    Math.min(
      items.length - 1,
      Math.max(0, Math.round(scrollTop / WHEEL_ITEM_HEIGHT)),
    );

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const next = items[nearestIndex(el.scrollTop)];
      if (next !== value) onChange(next);
    }, 120);
  };

  // ── 마우스 드래그(터치/펜은 네이티브 스크롤에 위임) ──────────────
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    drag.current = { startY: e.clientY, startTop: el.scrollTop };
    el.setPointerCapture(e.pointerId);
    el.style.scrollSnapType = "none"; // 드래그 중엔 스냅 해제
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current) return;
    el.scrollTop = drag.current.startTop - (e.clientY - drag.current.startY);
  };

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current) return;
    drag.current = null;
    el.releasePointerCapture?.(e.pointerId);
    el.style.scrollSnapType = ""; // 스냅 복구
    // 가장 가까운 항목으로 정렬(onChange 는 스크롤 settle 로 반영)
    el.scrollTo({ top: nearestIndex(el.scrollTop) * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
  };

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      tabIndex={0}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      className={cn(
        "snap-y snap-mandatory overflow-y-auto overscroll-contain",
        "h-[120px] cursor-grab touch-pan-y select-none active:cursor-grabbing",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <div style={{ height: PAD }} aria-hidden />
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
      <div style={{ height: PAD }} aria-hidden />
    </div>
  );
}
