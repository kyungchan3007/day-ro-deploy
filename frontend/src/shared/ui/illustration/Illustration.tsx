import Image from "next/image";

import { cn } from "../lib";
import datePlanning from "./assets/date-planning.png";
import placeChecklist from "./assets/place-checklist.png";
import mapPin from "./assets/map-pin.png";
import chatHeart from "./assets/chat-heart.png";
import intro from "./assets/intro.png";

/**
 * 데이로 스팟 일러스트(3D 보라 계열) 레지스트리.
 * 원본 비율은 각 정적 에셋에서 자동 추출된다(하드코딩 없음).
 */
const ILLUSTRATIONS = {
  /** 지도·캘린더를 보며 데이트를 계획하는 커플 (icon_2a). */
  "date-planning": datePlanning,
  /** 장소 체크리스트 클립보드 + 돋보기 (icon_2b). */
  "place-checklist": placeChecklist,
  /** 지도 위 위치 핀 (icon_3a). */
  "map-pin": mapPin,
  /** 하트 말풍선 (icon_3b). */
  "chat-heart": chatHeart,
  /** 지도·나침반·핀·로봇 (인트로/진입 스팟). */
  intro,
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

export interface IllustrationProps {
  /** 렌더할 일러스트 이름. */
  name: IllustrationName;
  /**
   * 렌더 폭(px). 높이는 원본 비율로 자동 계산.
   * `height` 와 함께 주면 둘 다 그대로 사용. 아무것도 없으면 width=160.
   */
  width?: number;
  /** 렌더 높이(px). 폭은 원본 비율로 자동 계산. */
  height?: number;
  /** LCP 최적화가 필요한 진입 화면에서 true. 기본 false. */
  priority?: boolean;
  /** 의미를 전달하는 경우 지정. 기본은 장식용("") 이다. */
  alt?: string;
  className?: string;
}

/**
 * 공용 일러스트 컴포넌트.
 *
 * 여러 화면(홈 카드·상황입력 등)에서 재사용되는 3D 스팟 이미지를 한 곳에서 관리한다.
 * 사이즈는 `width`/`height` prop 으로 동적 조절하며 원본 비율을 유지한다.
 *
 * @example
 * <Illustration name="date-planning" width={160} />
 * <Illustration name="map-pin" height={96} priority />
 */
export function Illustration({
  name,
  width,
  height,
  priority = false,
  alt = "",
  className,
}: IllustrationProps) {
  const asset = ILLUSTRATIONS[name];
  const ratio = asset.width / asset.height;

  let renderWidth: number;
  let renderHeight: number;
  if (width != null && height != null) {
    renderWidth = width;
    renderHeight = height;
  } else if (height != null) {
    renderHeight = height;
    renderWidth = Math.round(height * ratio);
  } else {
    renderWidth = width ?? 160;
    renderHeight = Math.round(renderWidth / ratio);
  }

  return (
    <Image
      src={asset}
      alt={alt}
      width={renderWidth}
      height={renderHeight}
      priority={priority}
      className={cn(className)}
    />
  );
}
