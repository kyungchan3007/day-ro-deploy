import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../lib";
import { ArrowLeftIcon } from "../icon";
import { LogoHorizontal } from "../logo";

export interface NavBarProps {
  /** 뒤로가기 버튼 표시. 기본 true. */
  showBack?: boolean;
  /** 뒤로가기 콜백(client). backHref 가 있으면 무시된다. */
  onBack?: () => void;
  /** 뒤로가기를 Link 로 렌더할 경로. 라우트 화면에서 SSR-friendly 하게 사용. */
  backHref?: string;
  /** 가운데 영역. 기본은 데이로 로고. */
  center?: ReactNode;
  /** 우측 액션 슬롯. */
  right?: ReactNode;
  className?: string;
}

const backClass =
  "flex size-9 items-center justify-center rounded-full text-text-strong transition-colors hover:bg-surface-subtle active:bg-border";

/**
 * nav-bar-top : 상단 내비게이션 바 (뒤로가기 + 중앙 로고).
 * 중앙/우측은 slot 으로 열어 조합 가능하게 한다(헤드리스 지향).
 */
export function NavBar({
  showBack = true,
  onBack,
  backHref,
  center,
  right,
  className,
}: NavBarProps) {
  return (
    <header className={cn("border-b border-border", className)}>
      <nav
        aria-label="상단 탐색"
        className="flex h-12 w-full items-center justify-between px-2"
      >
        <div className="flex w-12 items-center justify-start">
          {showBack &&
            (backHref ? (
              <Link href={backHref} aria-label="뒤로가기" className={backClass}>
                <ArrowLeftIcon size={22} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onBack}
                aria-label="뒤로가기"
                className={backClass}
              >
                <ArrowLeftIcon size={22} />
              </button>
            ))}
        </div>
        <div className="flex flex-1 items-center justify-center">
          {center ?? <LogoHorizontal height={22} />}
        </div>
        <div className="flex w-12 items-center justify-end">{right}</div>
      </nav>
    </header>
  );
}
