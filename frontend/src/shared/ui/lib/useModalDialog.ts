"use client";

import { useEffect, useEffectEvent, useRef, type RefObject } from "react";

import { trapTabFocus } from "./focus-trap";

export interface UseModalDialogOptions {
  /** 다이얼로그 열림 여부. */
  open: boolean;
  /** ESC 입력 시 호출. 처리 중 닫기 금지 같은 조건은 호출부에서 판단한다. */
  onEscape: () => void;
  /** 열릴 때 포커스를 받을 요소. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 닫힐 때 열기 직전 포커스 요소로 되돌릴지. 기본 true. */
  restoreFocus?: boolean;
  /** 초기 포커스를 다음 프레임으로 미룰지(전환 애니메이션 중 포커스 보장). 기본 false. */
  deferInitialFocus?: boolean;
  /** 포커스 가능한 요소가 없을 때 다이얼로그 자체에 포커스를 묶을지. 기본 false. */
  lockWhenEmpty?: boolean;
}

/**
 * 모달 다이얼로그 공통 동작 훅 (shared/ui/lib).
 *
 * 열려 있는 동안 초기 포커스 이동, ESC 닫기, Tab 순환(포커스 트랩)을 붙이고,
 * 닫히면 열기 직전 포커스 요소로 되돌린다. 반환한 ref 를 다이얼로그 컨테이너에 연결한다.
 * `onEscape`는 최신 값을 읽으므로 처리 중 상태가 바뀌어도 포커스가 다시 이동하지 않는다.
 *
 * @returns 다이얼로그 컨테이너 ref.
 */
export function useModalDialog<T extends HTMLElement = HTMLDivElement>({
  open,
  onEscape,
  initialFocusRef,
  restoreFocus = true,
  deferInitialFocus = false,
  lockWhenEmpty = false,
}: UseModalDialogOptions): RefObject<T | null> {
  const dialogRef = useRef<T>(null);
  const handleEscape = useEffectEvent(onEscape);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused =
      restoreFocus && document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const focusInitial = () => initialFocusRef?.current?.focus();
    const raf = deferInitialFocus ? requestAnimationFrame(focusInitial) : 0;
    if (!deferInitialFocus) {
      focusInitial();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleEscape();
        return;
      }
      if (dialogRef.current) {
        trapTabFocus(event, dialogRef.current, { lockWhenEmpty });
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, initialFocusRef, restoreFocus, deferInitialFocus, lockWhenEmpty]);

  return dialogRef;
}
