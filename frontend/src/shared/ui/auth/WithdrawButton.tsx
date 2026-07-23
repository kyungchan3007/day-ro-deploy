import Link from "next/link";
import { cn } from "../lib";

export interface WithdrawButtonProps {
  label: string;
  /** 있으면 Link 로 렌더(탈퇴 흐름 진입). 없으면 button. */
  href?: string;
  /** 실제 탈퇴 동작은 각 서비스가 주입한다(shared 에는 도메인 로직 없음). */
  onClick?: () => void;
  className?: string;
}

/**
 * 회원탈퇴 버튼 (auth 공용 UI).
 *
 * 작고 옅은 밑줄 텍스트 스타일만 제공하는 프레젠테이션 컴포넌트다.
 * 동작은 상위에서 href(진입) 또는 onClick 으로 주입한다.
 * (모노레포/packages 분리 시 여러 서비스가 공유)
 */
export function WithdrawButton({
  label,
  href,
  onClick,
  className,
}: WithdrawButtonProps) {
  const cls = cn(
    "mx-auto p-1 text-xs text-text-disabled underline transition-colors hover:text-text-muted",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {label}
    </button>
  );
}
