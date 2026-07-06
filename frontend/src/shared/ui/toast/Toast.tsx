import type { ReactNode } from "react";
import { cn } from "../lib";

export type ToastVariant = "success" | "info";

export interface ToastProps {
  message: ReactNode;
  variant?: ToastVariant;
  className?: string;
}

const dotClass: Record<ToastVariant, string> = {
  success: "bg-success",
  info: "bg-primary-weak",
};

/**
 * toast-msg-success : 다크 배경 토스트 바 (프레젠테이션 전용).
 * 노출/자동 소멸 로직은 useToast(헤드리스)가 담당한다.
 */
export function Toast({ message, variant = "success", className }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-pill bg-toast-bg px-4 py-2.5 text-[13px] font-medium text-white shadow-lg",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClass[variant])} />
      {message}
    </div>
  );
}
