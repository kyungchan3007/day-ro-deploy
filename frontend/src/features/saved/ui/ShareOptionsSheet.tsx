"use client";

import { useCallback, useId, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { MenuItem } from "@/shared/ui/menu";
import { useIsClient, useModalDialog } from "@/shared/ui/lib";
import styles from "./css/ShareOptionsSheet.module.css";

export interface ShareOptionsSheetProps {
  open: boolean;
  /** 시스템 공유(다른 앱으로 공유)를 보여줄지. 지원하지 않는 브라우저면 숨긴다. */
  canSystemShare: boolean;
  onClose: () => void;
  onCopyLink: () => void;
  onSystemShare: () => void;
}

/**
 * share-options-sheet : 길안내 공유 방법 바텀시트 (features/saved UI 조각, QA #12 · #19).
 *
 * "링크 복사" · "다른 앱으로 공유"(시스템 공유, 모바일에서 카카오톡 포함) 중 고르게 한다.
 * 실제 복사 · 공유 · 토스트는 상위 훅(useSavedCourseDetailScreen)이 담당하고, 이 컴포넌트는 선택만 받는다.
 * dialog 접근성(role/aria-modal, ESC/백드롭 닫기, 포커스 복귀)은 공용 `useModalDialog` 를 따른다.
 */
export function ShareOptionsSheet({
  open,
  canSystemShare,
  onClose,
  onCopyLink,
  onSystemShare,
}: ShareOptionsSheetProps) {
  const titleId = useId();
  const mounted = useIsClient();
  const dialogRef = useModalDialog({ open, onEscape: onClose });

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

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
      >
        <div className={styles.handle} aria-hidden />
        <h2 id={titleId} className={styles.title}>
          길안내 공유
        </h2>
        <ul>
          <li>
            <MenuItem label="링크 복사" onClick={onCopyLink} />
          </li>
          {canSystemShare ? (
            <li>
              <MenuItem label="다른 앱으로 공유" onClick={onSystemShare} />
            </li>
          ) : null}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
