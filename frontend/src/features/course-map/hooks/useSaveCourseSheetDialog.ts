"use client";

import { useCallback, useRef, type FormEvent } from "react";

export interface UseSaveCourseSheetDialogValue {
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  handleFormSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleClose: () => void;
}

/**
 * 코스 저장 sheet 의 dialog 동작 훅.
 * 공용 시트 동작(마운트 가드 · 모달 · 바깥 클릭 닫기)은 공용 `BottomSheet`(issue #227)에 맡기고,
 * 저장 중 닫기 금지 · 검증 실패 시 이름 입력 포커스만 이 훅이 소유한다.
 */
export function useSaveCourseSheetDialog(params: {
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<"success" | "validation_error" | "error">;
}): UseSaveCourseSheetDialogValue {
  const { saving, onClose, onSubmit } = params;
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [onClose, saving]);

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
    nameInputRef,
    handleFormSubmit,
    handleClose,
  };
}
