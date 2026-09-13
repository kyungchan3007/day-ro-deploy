import type { ReactNode } from "react";

import { cn } from "../lib";
import styles from "./css/Floating.module.css";

export interface FloatingProps {
  children: ReactNode;
  className?: string;
}

/**
 * floating : 자식을 위아래로 둥둥 띄우는 래퍼.
 * motion 전용 CSS Module에서 float 애니메이션을 적용한다.
 * `prefers-reduced-motion` 대응도 이 컴포넌트 가까이 둔다.
 */
export function Floating({ children, className }: FloatingProps) {
  return <div className={cn(styles.root, className)}>{children}</div>;
}
