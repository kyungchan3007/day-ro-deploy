import type { ReactNode } from "react";

import { cn } from "../lib";
import { Floating } from "../motion";

export interface LoadingScreenProps {
  /** 가운데 일러스트(둥둥 애니메이션이 적용된다). */
  illustration?: ReactNode;
  /** 일러스트와 메시지 사이에 들어가는 보조 콘텐츠. */
  middle?: ReactNode;
  /** 하단 본문 문구. 상태 문구를 middle 안에서 직접 배치하는 화면은 생략한다(issue #203). */
  message?: ReactNode;
  /** 보조 문구(선택). */
  subMessage?: ReactNode;
  className?: string;
}

/**
 * loading-screen : 헤더·푸터 없는 풀스크린 로딩 화면.
 *
 * 앱 프레임(640 중앙 + bg-frame 여백)은 유지해 다른 화면과 톤을 맞추고,
 * 가운데에 둥둥 뜨는 일러스트 + 문구를 배치한다. 여러 로딩 상황에서 재사용한다.
 */
export function LoadingScreen({
  illustration,
  middle,
  message,
  subMessage,
  className,
}: LoadingScreenProps) {
  return (
    <div className="flex min-h-dvh w-full justify-center bg-frame">
      <div
        className={cn(
          // 헤더 없는 화면이라 위 · 아래 여백(안전 영역 포함)을 직접 둔다.
          // 여백이 없으면 일러스트가 화면 맨 위에 붙고 둥둥 애니메이션에 윗부분이 잘렸다(issue #214).
          // 간격은 모바일(폭 640 미만)만 촘촘하게(16), 웹은 원래 간격(28).
          "flex min-h-dvh w-full max-w-app flex-col items-center justify-center gap-4 bg-surface px-6 text-center sm:gap-7",
          "pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.25rem)]",
          className,
        )}
      >
        {illustration && <Floating>{illustration}</Floating>}
        {middle}
        {message ? (
          <div>
            <p className="text-title leading-7 font-bold text-text-strong">{message}</p>
            {subMessage && (
              <p className="mt-1.5 text-control leading-5 text-text-muted">{subMessage}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
