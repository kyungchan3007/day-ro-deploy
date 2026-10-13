"use client";

import { useCallback, useRef, type FormEvent, type MouseEvent } from "react";

import { useIsClient, useModalDialog } from "@/shared/ui/lib";

export interface UseSaveCourseSheetDialogValue {
  mounted: boolean;
  dialogRef: React.RefObject<HTMLDivElement | null>;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  handleBackdropClick: (event: MouseEvent<HTMLDivElement>) => void;
  handleFormSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleClose: () => void;
}

/**
 * 코스 저장 sheet 의 dialog 동작 훅.
 * 공용 모달 동작(포커스 복귀, ESC 닫기, Tab 순환)은 `useModalDialog`에 맡기고,
 * 저장 중 닫기 금지·백드롭 닫기·검증 실패 시 이름 입력 포커스만 이 훅이 소유한다.
 */
export function useSaveCourseSheetDialog(params: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<"success" | "validation_error" | "error">;
}): UseSaveCourseSheetDialogValue {
  const { open, saving, onClose, onSubmit } = params;
  const mounted = useIsClient();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [onClose, saving]);

  // sheet 전환 애니메이션 중에도 포커스가 들어가도록 이름 입력 포커스는 다음 프레임에 준다.
  const dialogRef = useModalDialog({
    open,
    onEscape: handleClose,
    initialFocusRef: nameInputRef,
    deferInitialFocus: true,
  });

  const handleBackdropClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  const handleFormSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const result = await onSubmit();
      if (result === "validation_error") {
        nameInputRef.current?.focus();
      }
    },
    [onSubmit],
  );

  return {
    mounted,
    dialogRef,
    nameInputRef,
    handleBackdropClick,
    handleFormSubmit,
    handleClose,
  };
}
