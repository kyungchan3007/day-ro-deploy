"use client";

import { useMemo, useState } from "react";

import { REGION_GROUPS } from "../model/regions";

/**
 * 지역 스텝 상태 (그룹 칩 + 세부 칩 구조).
 *   - activeGroup: 현재 보고 있는 그룹 id (항상 하나)
 *   - activeAreas: activeGroup 의 세부 지역 목록
 *   - selected: 선택한 세부 지역 id (단일 선택). 그룹 전환해도 유지된다.
 *   - isValid: 지역을 하나 골랐는지
 */
export function useRegionStep(initial?: string) {
  const [selected, setSelected] = useState<string | undefined>(initial);

  const initialGroup =
    (initial &&
      REGION_GROUPS.find((g) => g.areas.some((a) => a.id === initial))?.id) ||
    REGION_GROUPS[0]?.id;
  const [activeGroup, setActiveGroup] = useState<string | undefined>(
    initialGroup,
  );

  const activeAreas = useMemo(
    () => REGION_GROUPS.find((g) => g.id === activeGroup)?.areas ?? [],
    [activeGroup],
  );

  const isValid = selected != null;

  return {
    selected,
    setSelected,
    activeGroup,
    setActiveGroup,
    activeAreas,
    isValid,
  };
}
