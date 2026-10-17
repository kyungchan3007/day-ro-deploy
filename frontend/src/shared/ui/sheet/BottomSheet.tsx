"use client";

import { useId, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { useSheetDialog } from "../lib";
import styles from "./css/BottomSheet.module.css";

export interface BottomSheetProps {
  open: boolean;
  /** ESC · 바깥 클릭으로 닫을 때 호출. 처리 중 닫기 금지 같은 조건은 호출부가 판단한다. */
  onClose: () => void;
  /** 시트 제목(가운데 정렬). dialog 이름으로도 쓰인다. */
  title: ReactNode;
  children: ReactNode;
  /** 열릴 때 포커스를 받을 요소. 없으면 시트 안 첫 포커스 가능 요소(없으면 시트 자체). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** 초기 포커스를 다음 프레임으로 미룰지. */
  deferInitialFocus?: boolean;
  /** dialog 설명으로 연결할 요소 id (상태 문구 등). */
  describedBy?: string;
}

/**
 * bottom-sheet : 화면 아래에서 올라오는 시트 껍데기 (issue #227).
 *
 * 딤 · 시트 · 손잡이 · 제목과 dialog 접근성(role · aria-modal · 포커스 이동 · ESC · 바깥 클릭 닫기)을 맡는다.
 * 안쪽 내용(메뉴 · 폼)은 children 으로 받는다. 시트 제어는 `useSheetDialog`(issue #192)를 쓴다.
 * 코스 저장 시트 · 길안내 공유 시트가 같은 껍데기를 따로 그리던 것을 공용으로 묶었다.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  initialFocusRef,
  deferInitialFocus,
  describedBy,
}: BottomSheetProps) {
  const titleId = useId();
  const { mounted, dialogRef, handleBackdropClick } = useSheetDialog({
    open,
    onClose,
    initialFocusRef,
    deferInitialFocus,
  });

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        ref={dialogRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <div className={styles.handle} aria-hidden />
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
