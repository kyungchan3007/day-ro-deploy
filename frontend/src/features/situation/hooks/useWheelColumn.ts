"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

export const WHEEL_ITEM_HEIGHT = 40;
const VISIBLE_ROWS = 3;
const PAD = WHEEL_ITEM_HEIGHT * ((VISIBLE_ROWS - 1) / 2);

/**
 * wheel-column의 DOM ref와 스크롤/드래그 전이 훅.
 */
export function useWheelColumn<T extends string | number>(params: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { items, value, onChange } = params;
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const drag = useRef<{ startY: number; startTop: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const idx = Math.max(0, items.indexOf(value));
    if (Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT) !== idx) {
      el.scrollTo({ top: idx * WHEEL_ITEM_HEIGHT });
    }
  }, [items, value]);

  const nearestIndex = useCallback(
    (scrollTop: number) =>
      Math.min(
        items.length - 1,
        Math.max(0, Math.round(scrollTop / WHEEL_ITEM_HEIGHT)),
      ),
    [items],
  );

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const next = items[nearestIndex(el.scrollTop)];
      if (next !== value) {
        onChange(next);
      }
    }, 120);
  }, [items, nearestIndex, onChange, value]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") {
        return;
      }
      const el = ref.current;
      if (!el) {
        return;
      }
      drag.current = { startY: event.clientY, startTop: el.scrollTop };
      el.setPointerCapture(event.pointerId);
      el.style.scrollSnapType = "none";
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || !drag.current) {
        return;
      }
      el.scrollTop = drag.current.startTop - (event.clientY - drag.current.startY);
    },
    [],
  );

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el || !drag.current) {
        return;
      }
      drag.current = null;
      el.releasePointerCapture?.(event.pointerId);
      el.style.scrollSnapType = "";
      el.scrollTo({
        top: nearestIndex(el.scrollTop) * WHEEL_ITEM_HEIGHT,
        behavior: "smooth",
      });
    },
    [nearestIndex],
  );

  return {
    ref,
    pad: PAD,
    itemHeight: WHEEL_ITEM_HEIGHT,
    containerHandlers: {
      onScroll: handleScroll,
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
    },
  };
}
