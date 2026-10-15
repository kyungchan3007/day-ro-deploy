"use client";

import { Toast, ToastViewport } from "@/shared/ui";
import { useLoginNoticeToast } from "../hooks/useLoginNoticeToast";

export interface LoginNoticeToastProps {
  notice?: string;
}

/**
 * 로그인 화면 전용 일회성 성공 토스트.
 */
export function LoginNoticeToast({ notice }: LoginNoticeToastProps) {
  const { toast, visible } = useLoginNoticeToast(notice);

  if (!visible || !toast) {
    return null;
  }

  return (
    <ToastViewport>
      <Toast message={toast.message} variant={toast.variant} />
    </ToastViewport>
  );
}
