"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/ui";

export interface KakaoLoginButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** 버튼 문구. 카카오 규정상 "카카오 로그인" 또는 "로그인"만 허용. */
  label: string;
}

/** 카카오 말풍선 심볼. 규정상 형태·비율·색상 변경 불가. */
function KakaoSymbol() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000" aria-hidden="true">
      <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z" />
    </svg>
  );
}

/**
 * 카카오 로그인 버튼 (features/auth 조각).
 *
 * 카카오 디자인 가이드 준수:
 *   - 배경 #FEE500, 심볼 검정, 레이블 #000 85% 불투명도, radius 12px.
 *   - #FEE500 은 카카오 고정 브랜드 컬러라 데이로 디자인 토큰에 넣지 않고 이 컴포넌트에 격리한다.
 *
 * 인증 로직은 포함하지 않는다. onClick 등 핸들러는 상위(클라이언트)에서 주입한다.
 */
export function KakaoLoginButton({
  label,
  className,
  type = "button",
  ...props
}: KakaoLoginButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative flex h-12 w-full items-center justify-center rounded-[12px] bg-[#FEE500] px-4",
        "transition-opacity hover:opacity-90 active:opacity-80",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-4 flex items-center">
        <KakaoSymbol />
      </span>
      <span className="text-[15px] font-medium text-[rgba(0,0,0,0.85)]">
        {label}
      </span>
    </button>
  );
}
