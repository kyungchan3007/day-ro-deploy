import type { ReactNode } from "react";

import { cn } from "../lib";

export interface FloatingProps {
  children: ReactNode;
  className?: string;
}

/**
 * floating : 자식을 위아래로 둥둥 띄우는 래퍼.
 * `--animate-float` 토큰(2.4s ease-in-out)을 사용하며,
 * `prefers-reduced-motion` 이면 애니메이션이 멈춘다(globals.css).
 */
export function Floating({ children, className }: FloatingProps) {
  return <div className={cn("animate-float", className)}>{children}</div>;
}
