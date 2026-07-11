import Image from "next/image";
import { cn } from "../lib";
import logoSymbol from "./assets/logo-symbol.png";

/** 원본 심볼 비율 (64 x 58). */
const RATIO = 64 / 58;

export interface LogoSymbolProps {
  /** 렌더 높이(px). 폭은 원본 비율로 자동 계산. 기본 24. */
  height?: number;
  /** LCP 최적화가 필요한 진입 화면에서 true. 기본 false. */
  priority?: boolean;
  alt?: string;
  className?: string;
}

/**
 * 데이로 심볼 로고(마크 only, 워드마크 없음).
 *
 * 파비콘/앱 아이콘과 동일한 심볼 에셋(assets/logo-symbol.png)을 사용한다.
 * 헤더 아이콘, 로딩, 빈 상태 등 여러 곳에서 재사용한다.
 * 심볼+워드마크 가로형은 <LogoHorizontal />, 세로 적층형은 <LogoFull /> 을 쓴다.
 */
export function LogoSymbol({
  height = 24,
  priority = false,
  alt = "Dayro",
  className,
}: LogoSymbolProps) {
  return (
    <Image
      src={logoSymbol}
      alt={alt}
      height={height}
      width={Math.round(height * RATIO)}
      priority={priority}
      className={cn(className)}
    />
  );
}
