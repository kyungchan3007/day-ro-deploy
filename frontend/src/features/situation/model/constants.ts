import type { Meridiem, PurposeChoice, TransportChoice } from "./types";

export const MERIDIEMS: readonly Meridiem[] = ["오전", "오후"] as const;

/** 시(1~12). */
export const HOURS: readonly number[] = Array.from({ length: 12 }, (_, i) => i + 1);

/** 분(0~55, 5분 단위). */
export const MINUTES: readonly number[] = Array.from({ length: 12 }, (_, i) => i * 5);

/** 이동수단 선택지 순서. */
export const TRANSPORT_CHOICES: readonly TransportChoice[] = [
  "car",
  "walk",
  "subway",
  "bus",
];

/** 목적 선택지 순서. */
export const PURPOSE_CHOICES: readonly PurposeChoice[] = [
  "date",
  "blind",
  "friends",
  "anniversary",
];
