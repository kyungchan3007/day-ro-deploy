import type { ComponentType } from "react";

import {
  CoffeeIcon,
  GiftIcon,
  HeartIcon,
  SmileIcon,
  type IconProps,
} from "@/shared/ui";

import type { PurposeChoice } from "../model";

export interface PurposeMeta {
  label: string;
  Icon: ComponentType<IconProps>;
  /** 아이콘 accent 색 토큰. */
  colorVar: string;
}

/** 목적 카드/요약 칩이 공유하는 메타(라벨·아이콘·색). */
export const PURPOSE_META: Record<PurposeChoice, PurposeMeta> = {
  date: {
    label: "데이트",
    Icon: HeartIcon,
    colorVar: "var(--color-purpose-date)",
  },
  blind: {
    label: "소개팅",
    Icon: CoffeeIcon,
    colorVar: "var(--color-purpose-blind)",
  },
  friends: {
    label: "친구와 놀기",
    Icon: SmileIcon,
    colorVar: "var(--color-purpose-friends)",
  },
  anniversary: {
    label: "기념일·특별한 날",
    Icon: GiftIcon,
    colorVar: "var(--color-purpose-anniversary)",
  },
};
