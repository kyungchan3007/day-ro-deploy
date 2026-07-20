import { cn } from "../lib";
import { LogoutIcon } from "../icon";

export interface LogoutButtonProps {
  /** 실제 로그아웃 동작은 상위에서 주입(shared 에는 세션 로직 없음). */
  onClick?: () => void;
  className?: string;
}

/**
 * 로그아웃 전용 버튼 (auth 공용 UI).
 *
 * 아이콘·라벨을 내장해 props 없이 그대로 쓴다. 동작만 onClick 으로 주입한다.
 * (모노레포/packages 분리 시 여러 서비스가 공유, Storybook 대상)
 */
export function LogoutButton({ onClick, className }: LogoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-1 py-3.5 text-left text-[15px] font-semibold text-text-strong active:opacity-60",
        className,
      )}
    >
      <LogoutIcon size={18} className="text-text-muted" />
      로그아웃
    </button>
  );
}
