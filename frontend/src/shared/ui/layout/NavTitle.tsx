import type { ReactNode } from "react";
import { cn } from "../lib";

export interface NavTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * nav-title : 상단 내비 바 가운데 화면 제목 (issue #227).
 * `NavBar` · `AccountNavBar` 의 `center` 슬롯에 넣는다. 화면마다 같은 CSS 를 따로 두던 것을 공용으로 묶었다.
 */
export function NavTitle({ children, className }: NavTitleProps) {
  return (
    <span className={cn("text-title font-bold text-text-strong", className)}>
      {children}
    </span>
  );
}
