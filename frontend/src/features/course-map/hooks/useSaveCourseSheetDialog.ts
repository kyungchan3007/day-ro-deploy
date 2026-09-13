"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
  type FormEvent,
  type MouseEvent,
} from "react";

const noopSubscribe = () => () => {};

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
 * portal 마운트, 포커스 복귀, ESC 닫기, Tab 순환, 백드롭 닫기, 검증 실패 포커스를 묶는다.
 */
export function useSaveCourseSheetDialog(params: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => Promise<"success" | "validation_error" | "error">;
}): UseSaveCourseSheetDialogValue {
  const { open, saving, onClose, onSubmit } = params;
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [onClose, saving]);

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

  useEffect(() => {
    if (open || !returnFocusRef.current) {
      return;
    }

    returnFocusRef.current.focus();
    returnFocusRef.current = null;
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const raf = requestAnimationFrame(() => nameInputRef.current?.focus());
    document.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [handleClose, open]);

  return {
    mounted,
    dialogRef,
    nameInputRef,
    handleBackdropClick,
    handleFormSubmit,
    handleClose,
  };
}
