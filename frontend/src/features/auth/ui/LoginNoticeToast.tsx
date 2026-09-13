"use client";

import { Toast } from "@/shared/ui";
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
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center px-4">
      <Toast message={toast.message} variant={toast.variant} />
    </div>
  );
}
