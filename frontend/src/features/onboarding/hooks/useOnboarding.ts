"use client";

import { useCallback, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { useRouter } from "next/navigation";

import { markGuestBrowse } from "../lib/guest-browse-cookie";
import { isLastSlide, moveNext, movePrev, swipeTarget, type OnboardingMove } from "../model/onboarding-steps";

export interface UseOnboardingValue {
  index: number;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  /** 건너뛰기 · 시작하기: 둘러보기 선택을 기록하고 홈으로. */
  finish: () => void;
  onTouchStart: (event: TouchEvent<HTMLElement>) => void;
  onTouchEnd: (event: TouchEvent<HTMLElement>) => void;
  onTouchCancel: () => void;
  /** 좌우 화살표로 장 넘김(키보드 사용자). */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * 온보딩 장 이동 · 스와이프 · 종료 (features/onboarding, issue #230).
 * 이동 규칙은 `model/onboarding-steps`, 화면은 반환값을 바인딩만 한다.
 */
export function useOnboarding(total: number): UseOnboardingValue {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  // 한 손가락 스와이프만 본다. 시작 위치 · 손가락 id 를 기억하고, 끝나거나 취소되면 지운다.
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null);

  const finish = useCallback(() => {
    markGuestBrowse();
    // 뒤로가기로 온보딩에 다시 들어오지 않게 기록을 바꾼다.
    router.replace("/");
  }, [router]);

  const apply = useCallback(
    (move: OnboardingMove) => {
      if (move.type === "slide") setIndex(move.index);
      else if (move.type === "start") router.push("/");
      else finish();
    },
    [finish, router],
  );

  const next = useCallback(() => apply(moveNext(index, total)), [apply, index, total]);
  const prev = useCallback(() => apply(movePrev(index)), [apply, index]);

  const onTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    // 두 손가락(확대 등)은 스와이프로 보지 않는다.
    touchStart.current =
      event.touches.length === 1 && touch ? { id: touch.identifier, x: touch.clientX, y: touch.clientY } : null;
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const end = Array.from(event.changedTouches).find((touch) => touch.identifier === start.id);
      if (!end) return;
      setIndex((current) => swipeTarget(current, total, end.clientX - start.x, end.clientY - start.y));
    },
    [total],
  );

  const onTouchCancel = useCallback(() => {
    touchStart.current = null;
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "ArrowRight") setIndex((current) => swipeTarget(current, total, -Infinity));
      else if (event.key === "ArrowLeft") setIndex((current) => swipeTarget(current, total, Infinity));
    },
    [total],
  );

  return { index, isLast: isLastSlide(index, total), next, prev, finish, onTouchStart, onTouchEnd, onTouchCancel, onKeyDown };
}
