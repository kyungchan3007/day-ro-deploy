import type { ReactNode } from "react";
import { Illustration, type IllustrationName } from "../illustration";
import { cn } from "../lib";

export interface EmptyStateProps {
  /** 위쪽 일러스트. 기본 date-planning. */
  illustration?: IllustrationName;
  title: ReactNode;
  description?: ReactNode;
  /** 제목 태그. 화면 대표 제목이면 h1, 목록 안 빈 상태면 p(기본). */
  titleAs?: "p" | "h1" | "h2";
  /** 아래 행동 버튼 슬롯. `Button` 또는 `buttonClassName` 링크를 넣는다. */
  action?: ReactNode;
  className?: string;
}

/**
 * empty-state : 일러스트 + 제목 + 설명 + 행동 버튼 (issue #227).
 * 찜 목록 빈 상태 · 공유 링크 이동 화면이 같은 마크업을 따로 쓰던 것을 공용으로 묶었다.
 */
export function EmptyState({
  illustration = "date-planning",
  title,
  description,
  titleAs: Title = "p",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 px-6 py-16 text-center", className)}>
      <Illustration name={illustration} width={140} />
      <div className="flex flex-col gap-1.5">
        <Title className="text-body font-semibold text-text-strong">{title}</Title>
        {description ? (
          <p className="text-label leading-relaxed text-text-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
