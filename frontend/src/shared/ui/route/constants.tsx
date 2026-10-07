import type { ComponentType } from "react";
import {
  WalkIcon,
  SubwayIcon,
  BusIcon,
  CarIcon,
  type IconProps,
} from "../icon";

export type TransportMode =
  | "start"
  | "walk"
  | "subway"
  | "bus"
  | "car"
  | "arrive";

export interface TransportModeMeta {
  label: string;
  /** 스텝 원형 배경에 쓰는 CSS 변수. */
  colorVar: string;
  Icon: ComponentType<IconProps> | null;
}

/**
 * 이동수단 메타데이터. badge-number-place / label-transport / transport-info 가 공유.
 * 색은 토큰 CSS 변수로만 참조한다(테마 교체 대비).
 */
export const TRANSPORT_META: Record<TransportMode, TransportModeMeta> = {
  start: { label: "시작", colorVar: "var(--color-transport-start)", Icon: null },
  walk: { label: "도보", colorVar: "var(--color-transport-walk)", Icon: WalkIcon },
  subway: {
    label: "전철",
    colorVar: "var(--color-transport-subway)",
    Icon: SubwayIcon,
  },
  bus: { label: "버스", colorVar: "var(--color-transport-bus)", Icon: BusIcon },
  car: { label: "자동차", colorVar: "var(--color-transport-car)", Icon: CarIcon },
  arrive: {
    label: "도착",
    colorVar: "var(--color-transport-arrive)",
    Icon: null,
  },
};

/** badge-number-place 기본 스텝 순서. */
export const DEFAULT_TRANSPORT_STEPS: TransportMode[] = [
  "start",
  "walk",
  "subway",
  "bus",
  "car",
  "arrive",
];
