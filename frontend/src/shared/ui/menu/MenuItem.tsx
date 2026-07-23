import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "../lib";

export interface MenuItemProps {
  /** 좌측 아이콘(선택). */
  icon?: ReactNode;
  label: string;
  /** 있으면 Link 로 렌더(네비게이션). */
  href?: string;
  /** 있으면 button 으로 렌더(액션). 실제 동작은 상위에서 주입. */
  onClick?: () => void;
  className?: string;
}

const base =
  "flex w-full items-center gap-2.5 px-1 py-3.5 text-left text-[15px] font-semibold text-text-strong active:opacity-60";

/**
 * 메뉴 행 (공용 UI primitive).
 *
 * 아이콘 + 라벨의 한 줄 메뉴 항목. `href` 면 Link, `onClick` 이면 button 으로 렌더한다.
 * 도메인 로직은 담지 않고(동작은 주입), 드로어/설정 등 여러 메뉴에서 재사용한다.
 * (모노레포/packages/ui 분리 및 Storybook 대상)
 */
export function MenuItem({ icon, label, href, onClick, className }: MenuItemProps) {
  const content = (
    <>
      {icon}
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(base, className)}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cn(base, className)}>
      {content}
    </button>
  );
}
