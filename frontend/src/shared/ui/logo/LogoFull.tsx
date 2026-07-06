import Image from "next/image";
import { cn } from "../lib";
import logoFull from "./assets/logo-full.png";

/** 원본 로고 비율 (362 x 282). */
const RATIO = 282 / 362;

export interface LogoFullProps {
  /** 렌더 폭(px). 높이는 원본 비율로 자동 계산. 기본 160. */
  width?: number;
  /** LCP 최적화가 필요한 진입 화면에서 true. 기본 false. */
  priority?: boolean;
  alt?: string;
  className?: string;
}

/**
 * 데이로 전체 로고 (심볼 + 워드마크, 세로 적층형).
 *
 * 공식 로고 원본이 벡터가 아닌 래스터라 PNG 에셋(assets/logo-full.png, 2x)을 사용한다.
 * 벡터 SVG 수령 시 이 에셋과 컴포넌트를 교체한다.
 * NavBar 등에서 쓰는 가로형 임시 마크는 별도 컴포넌트 <Logo /> 를 계속 사용한다.
 */
export function LogoFull({
  width = 160,
  priority = false,
  alt = "Dayro",
  className,
}: LogoFullProps) {
  return (
    <Image
      src={logoFull}
      alt={alt}
      width={width}
      height={Math.round(width * RATIO)}
      priority={priority}
      className={cn(className)}
    />
  );
}
