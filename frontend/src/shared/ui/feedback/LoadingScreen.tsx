import type { ReactNode } from "react";

import { cn } from "../lib";
import { Floating } from "../motion";

export interface LoadingScreenProps {
  /** 가운데 일러스트(둥둥 애니메이션이 적용된다). */
  illustration?: ReactNode;
  /** 일러스트와 메시지 사이에 들어가는 보조 콘텐츠. */
  middle?: ReactNode;
  /** 본문 문구. */
  message: ReactNode;
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
          "flex min-h-dvh w-full max-w-[640px] flex-col items-center justify-center gap-7 bg-surface px-6 text-center",
          className,
        )}
      >
        {illustration && <Floating>{illustration}</Floating>}
        {middle}
        <div>
          <p className="text-lg font-bold text-text-strong">{message}</p>
          {subMessage && (
            <p className="mt-1.5 text-sm text-text-muted">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
