import { cn } from "../lib";

export interface LogoProps {
  /** 로고 높이(px). 기본 24. */
  height?: number;
  /** 워드마크 표시 여부. false 면 심볼만. 기본 true. */
  withWordmark?: boolean;
  className?: string;
  title?: string;
}

/**
 * 데이로 로고 (logo-horizontal).
 *
 * NOTE: 현재는 SVG 컴포넌트 시트에서 근사한 임시 마크다.
 * 공식 로고 SVG 에셋 수령 시 이 파일의 <svg> 심볼만 교체하면 된다.
 */
export function Logo({
  height = 24,
  withWordmark = true,
  className,
  title = "Dayro",
}: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 align-middle", className)}
      role="img"
      aria-label={title}
    >
      <svg
        height={height}
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M14 2c6.075 0 11 4.701 11 10.5 0 5.799-4.925 10.5-11 10.5a12.6 12.6 0 0 1-3.2-.41L5 25l1.2-4.2C3.6 18.86 3 15.86 3 12.5 3 6.701 7.925 2 14 2Z"
          fill="var(--color-primary)"
        />
        <circle cx="10.5" cy="12.5" r="1.6" fill="#F070FF" />
        <circle cx="16.5" cy="12.5" r="1.6" fill="#FFFFFF" />
      </svg>
      {withWordmark && (
        <span
          className="font-extrabold tracking-tight text-text-strong"
          style={{ fontSize: height * 0.72, lineHeight: 1 }}
        >
          Da<span className="text-primary">y</span>ro
        </span>
      )}
    </span>
  );
}
