"use client";

import { useState } from "react";

import type { PurposeChoice } from "../model/types";

/**
 * 목적 스텝 상태(단일 선택).
 *   - selected: 고른 목적
 *   - isValid: 하나 골랐는지
 */
export function usePurposeStep(initial?: PurposeChoice) {
  const [selected, setSelected] = useState<PurposeChoice | undefined>(initial);
  const isValid = selected != null;
  return { selected, setSelected, isValid };
}
