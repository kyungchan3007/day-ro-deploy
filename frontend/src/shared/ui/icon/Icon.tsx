import type { SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** 아이콘 한 변 크기(px). 기본 20. */
  size?: number;
}

/**
 * 모든 아이콘의 베이스 래퍼.
 * - stroke/fill 은 `currentColor` 를 따르므로 부모의 text color 로 색을 제어한다.
 * - 실제 아이콘 에셋(Figma) 수령 시 각 path 만 교체하면 된다.
 */
export function IconBase({
  size = 20,
  strokeWidth = 1.75,
  className,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}
