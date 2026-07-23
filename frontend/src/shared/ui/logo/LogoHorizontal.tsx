import Image from "next/image";
import { cn } from "../lib";
import logoHorizontal from "./assets/logo-horizontal.png";

/** 원본 가로 로고 비율 (222 x 53). */
const RATIO = 222 / 53;

export interface LogoHorizontalProps {
  /** 렌더 높이(px). 폭은 원본 비율로 자동 계산. 기본 24. */
  height?: number;
  /** LCP 최적화가 필요한 진입 화면에서 true. 기본 false. */
  priority?: boolean;
  alt?: string;
  className?: string;
}

/**
 * 데이로 가로형 로고 (심볼 + 워드마크 나란히). 헤더/NavBar 용.
 *
 * 공식 로고 원본이 벡터가 아닌 래스터라 PNG 에셋(assets/logo-horizontal.png)을 사용한다.
 * 벡터 SVG 수령 시 이 에셋과 컴포넌트를 교체한다.
 * 세로 적층형(로그인 등)은 <LogoFull /> 을 사용한다.
 */
export function LogoHorizontal({
  height = 24,
  priority = false,
  alt = "Dayro",
  className,
}: LogoHorizontalProps) {
  return (
    <Image
      src={logoHorizontal}
      alt={alt}
      height={height}
      width={Math.round(height * RATIO)}
      priority={priority}
      className={cn(className)}
    />
  );
}
