import type { ComponentType } from "react";

import {
  BusIcon,
  CarIcon,
  SubwayIcon,
  WalkIcon,
  type IconProps,
} from "@/shared/ui";

import type { TransportChoice } from "../model";

export interface TransportMeta {
  label: string;
  Icon: ComponentType<IconProps>;
  /** 이동수단 색 토큰(CSS 변수). */
  colorVar: string;
}

/** 이동수단 카드/요약 칩이 공유하는 메타(라벨·아이콘·색). */
export const TRANSPORT_META: Record<TransportChoice, TransportMeta> = {
  car: { label: "자차·택시", Icon: CarIcon, colorVar: "var(--color-transport-car)" },
  walk: { label: "도보", Icon: WalkIcon, colorVar: "var(--color-transport-walk)" },
  subway: {
    label: "지하철",
    Icon: SubwayIcon,
    colorVar: "var(--color-transport-subway)",
  },
  bus: { label: "버스", Icon: BusIcon, colorVar: "var(--color-transport-bus)" },
};
