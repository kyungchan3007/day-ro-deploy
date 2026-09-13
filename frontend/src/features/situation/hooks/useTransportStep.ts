"use client";

import { useState } from "react";

import type { TransportChoice, TransportSelection } from "../model/types";

/**
 * 이동수단 스텝 상태.
 *   - go: 현재 위치 → 목적지 이동수단
 *   - local: 도착 후 이동수단
 *   - isValid: 두 구간 모두 선택됐는지
 */
export function useTransportStep(initial?: TransportSelection) {
  const [go, setGo] = useState<TransportChoice | undefined>(initial?.go);
  const [local, setLocal] = useState<TransportChoice | undefined>(
    initial?.local,
  );

  const isValid = go != null && local != null;

  return { go, setGo, local, setLocal, isValid };
}
