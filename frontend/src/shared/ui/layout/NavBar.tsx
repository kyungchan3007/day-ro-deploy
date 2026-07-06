import type { ReactNode } from "react";
import { cn } from "../lib";
import { ArrowLeftIcon } from "../icon";
import { Logo } from "../logo";

export interface NavBarProps {
  /** 뒤로가기 버튼 표시. 기본 true. */
  showBack?: boolean;
  onBack?: () => void;
  /** 가운데 영역. 기본은 데이로 로고. */
  center?: ReactNode;
  /** 우측 액션 슬롯. */
  right?: ReactNode;
  className?: string;
}

/**
 * nav-bar-top : 상단 내비게이션 바 (뒤로가기 + 중앙 로고).
 * 중앙/우측은 slot 으로 열어 조합 가능하게 한다(헤드리스 지향).
 */
export function NavBar({
  showBack = true,
  onBack,
  center,
  right,
  className,
}: NavBarProps) {
  return (
    <header
      className={cn(
        "flex h-12 w-full items-center justify-between border-b border-border px-2",
        className,
      )}
    >
      <div className="flex w-12 items-center justify-start">
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="뒤로가기"
            className="flex size-9 items-center justify-center rounded-full text-text-strong transition-colors hover:bg-surface-subtle active:bg-border"
          >
            <ArrowLeftIcon size={22} />
          </button>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center">
        {center ?? <Logo height={22} />}
      </div>
      <div className="flex w-12 items-center justify-end">{right}</div>
    </header>
  );
}
