"use client";

import { useCallback, useState } from "react";
import { useWithdraw } from "./useWithdraw";

export interface UseWithdrawReasonFormResult {
  selected: Set<string>;
  etcText: string;
  confirmOpen: boolean;
  doneOpen: boolean;
  canNext: boolean;
  pending: boolean;
  error: boolean;
  toggleReason: (value: string) => void;
  setEtcText: (value: string) => void;
  openConfirm: () => void;
  closeConfirm: () => void;
  confirmWithdraw: () => Promise<void>;
  closeDone: () => void;
}

/**
 * 회원탈퇴 사유 폼 상태/전이 훅.
 *
 * 사유 선택, 직접 입력, 확인/완료 모달 open state, 탈퇴 성공/실패 후속 정책을
 * UI 밖으로 분리해 WithdrawReasonForm 이 렌더링만 담당하게 만든다.
 */
export function useWithdrawReasonForm(): UseWithdrawReasonFormResult {
  const { withdraw, pending, error, reset, finish } = useWithdraw();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [etcText, setEtcTextState] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);

  const toggleReason = useCallback((value: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const setEtcText = useCallback((value: string) => {
    setEtcTextState(value);
  }, []);

  const openConfirm = useCallback(() => {
    if (selected.size === 0) {
      return;
    }

    setConfirmOpen(true);
  }, [selected]);

  const closeConfirm = useCallback(() => {
    if (pending) {
      return;
    }

    reset();
    setConfirmOpen(false);
  }, [pending, reset]);

  const confirmWithdraw = useCallback(async () => {
    const ok = await withdraw();

    if (!ok) {
      return;
    }

    setConfirmOpen(false);
    setDoneOpen(true);
  }, [withdraw]);

  const closeDone = useCallback(() => {
    finish();
  }, [finish]);

  return {
    selected,
    etcText,
    confirmOpen,
    doneOpen,
    canNext: selected.size > 0,
    pending,
    error,
    toggleReason,
    setEtcText,
    openConfirm,
    closeConfirm,
    confirmWithdraw,
    closeDone,
  };
}
