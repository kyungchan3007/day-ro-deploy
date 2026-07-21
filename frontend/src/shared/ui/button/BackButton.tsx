import Link from "next/link";

import { ArrowLeftIcon } from "../icon";
import { cn } from "../lib";

export interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

const baseClass =
  "flex size-9 items-center justify-center rounded-full text-text-strong transition-colors hover:bg-surface-subtle active:bg-border";

/**
 * 공용 뒤로가기 버튼.
 * 이동이 필요하면 Link, 현재 화면 동작이면 button 으로 렌더한다.
 */
export function BackButton({
  href,
  onClick,
  ariaLabel = "뒤로가기",
  className,
}: BackButtonProps) {
  const classes = cn(baseClass, className);

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={classes}>
        <ArrowLeftIcon size={22} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={classes}
    >
      <ArrowLeftIcon size={22} />
    </button>
  );
}
