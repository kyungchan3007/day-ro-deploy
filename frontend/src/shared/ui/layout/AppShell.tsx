import type { ReactNode } from "react";
import { cn } from "../lib";

export interface AppShellProps {
  /** 상단 내비게이션 슬롯 (예: <NavBar />). 컬럼 최상단에 배치된다. */
  nav?: ReactNode;
  /** 하단 고정 액션/탭 슬롯 (예: CTA 버튼, 바텀 탭). 컬럼 최하단에 배치된다. */
  footer?: ReactNode;
  /** 본문. 스캐폴딩 단계에서는 비어 있을 수 있다. */
  children?: ReactNode;
  /**
   * 본문 좌우/상하 기본 패딩을 제거한다(full-bleed 컨텐츠용).
   * 지도·이미지처럼 화면 끝까지 붙여야 할 때만 사용하고, 내부 정렬은 <Container> 로 잡는다.
   */
  bleed?: boolean;
  /** 본문(main) 클래스 확장. */
  className?: string;
}

/**
 * app-shell : 모든 화면의 표준 반응형 골격.
 *
 * 시안(*Mobile-first) 규칙을 코드로 강제한다.
 *   - 콘텐츠는 항상 중앙 단일 컬럼(max 640px).
 *   - 모바일(≤640): 컬럼이 화면을 꽉 채움(Full).
 *   - 640 초과: 컬럼은 640에서 멈추고, 좌우 여백은 프레임 색(bg-frame, 미색)으로 채워진다.
 *   - 복잡한 반응형 그리드 없이 컬럼 폭만 고정 → 요소는 비율대로만 커진다.
 *
 * 앞으로 만드는 모든 페이지는 이 컴포넌트로 감싼다.
 */
export function AppShell({
  nav,
  footer,
  children,
  bleed = false,
  className,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-frame">
      <div className="flex min-h-dvh w-full max-w-[640px] flex-col bg-surface">
        {nav}
        <main
          className={cn("flex-1", bleed ? undefined : "px-4 py-4 sm:px-6", className)}
        >
          {children}
        </main>
        {footer}
      </div>
    </div>
  );
}
