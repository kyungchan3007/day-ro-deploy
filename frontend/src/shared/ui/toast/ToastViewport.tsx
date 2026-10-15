import { Children, type ReactNode } from "react";

import { cn } from "../lib";
import styles from "./css/ToastViewport.module.css";

export interface ToastViewportProps {
  /** 표시할 토스트(여러 개면 위에서부터 쌓는다). 비어 있으면 렌더하지 않는다. */
  children?: ReactNode;
  className?: string;
}

/**
 * toast-viewport : 토스트 배치 전담 (프레젠테이션 전용, issue #194).
 *
 * 전 화면 토스트를 헤더 바로 아래 상단 한 곳에 띄운다(모바일 기준: 하단 CTA · 키보드 · 시트와 비겹침).
 * 노출 · 자동 소멸은 `useToast`, 모양은 `Toast` 가 담당하고, 이 컴포넌트는 위치만 정한다.
 */
export function ToastViewport({ children, className }: ToastViewportProps) {
  if (Children.toArray(children).length === 0) {
    return null;
  }

  return (
    <div className={cn(styles.viewport, className)} data-toast-viewport="">
      <div className={styles.stack}>{children}</div>
    </div>
  );
}
