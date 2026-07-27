"use client";

import { createPortal } from "react-dom";
import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "../lib";

/** hydration-safe 클라이언트 감지 (portal 은 클라 전용). */
const noopSubscribe = () => () => {};

export interface ConfirmDialogProps {
  open: boolean;
  /** backdrop 클릭·Esc·취소 시 호출. */
  onClose: () => void;
  icon?: ReactNode;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  /** 확인 버튼 톤. 기본 primary. */
  confirmTone?: "primary" | "danger";
  /** 있으면 취소 버튼도 렌더(2버튼). 없으면 확인 버튼 단독. */
  cancelLabel?: string;
  /** 처리 중 상태. true 면 버튼을 잠그고 backdrop·Esc 닫기를 막는다. */
  pending?: boolean;
}

/**
 * confirm-dialog : 범용 확인 다이얼로그 (공용 UI primitive).
 *
 * 화면 전체를 덮는 센터 모달. document.body 로 portal 하고 `fixed` 로 렌더한다.
 * 도메인 로직은 담지 않고 동작은 onConfirm/onClose 로 주입한다. (로그아웃·탈퇴 등 재사용)
 */
export function ConfirmDialog({
  open,
  onClose,
  icon,
  title,
  body,
  confirmLabel,
  onConfirm,
  confirmTone = "primary",
  cancelLabel,
  pending = false,
}: ConfirmDialogProps) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, pending]);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-hidden={!open}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-busy={pending || undefined}
        aria-labelledby={titleId}
        aria-describedby={body ? bodyId : undefined}
        className={cn(
          "w-full max-w-[300px] rounded-2xl bg-surface p-6 text-center shadow-xl transition-transform duration-200",
          open ? "scale-100" : "scale-95",
        )}
      >
        {icon && (
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-surface-subtle">
            {icon}
          </div>
        )}
        <p id={titleId} className="text-base font-bold text-text-strong">
          {title}
        </p>
        {body && (
          <div
            id={bodyId}
            className="mt-2 text-sm leading-relaxed text-text-muted"
          >
            {body}
          </div>
        )}
        <div className="mt-5 flex gap-2">
          {cancelLabel && (
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="h-11 flex-1 rounded-xl bg-surface-subtle text-sm font-semibold text-text-strong transition active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "h-11 flex-1 rounded-xl text-sm font-semibold text-white transition active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60",
              confirmTone === "danger" ? "bg-danger" : "bg-primary",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
