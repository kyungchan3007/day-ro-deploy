"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastVariant } from "./Toast";

export interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

export interface UseToastOptions {
  /** 자동 소멸까지의 시간(ms). 기본 2000. */
  duration?: number;
}

/**
 * 헤드리스 토스트 동작 훅.
 * UI 는 <Toast /> 로 렌더하고, 노출/자동 소멸만 여기서 관리한다.
 */
export function useToast({ duration = 2000 }: UseToastOptions = {}) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const hide = useCallback(() => {
    clear();
    setToast(null);
  }, [clear]);

  const show = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      clear();
      setToast({ id: Date.now(), message, variant });
      timer.current = setTimeout(() => setToast(null), duration);
    },
    [clear, duration],
  );

  useEffect(() => clear, [clear]);

  return { toast, visible: toast !== null, show, hide };
}
