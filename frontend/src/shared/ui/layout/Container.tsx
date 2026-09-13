import type { ElementType, ReactNode } from "react";
import { cn } from "../lib";

export interface ContainerProps {
  /** 렌더 태그. 기본 div (예: "section", "main"). */
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

/**
 * container : 640px 중앙 정렬 + 반응형 좌우 패딩 래퍼.
 *
 * AppShell 이 이미 컬럼 폭(640)을 고정하므로 일반 페이지는 AppShell 만으로 충분하다.
 * 이 컴포넌트는 AppShell 의 `bleed` 본문 안에서 특정 섹션만 640 폭으로 다시 정렬하거나,
 * AppShell 밖(랜딩 등)에서 콘텐츠 폭을 맞출 때 사용한다.
 */
export function Container({ as: Comp = "div", children, className }: ContainerProps) {
  return (
    <Comp className={cn("mx-auto w-full max-w-[640px] px-4 sm:px-6", className)}>
      {children}
    </Comp>
  );
}
