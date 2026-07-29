"use client";

import { useMemo, useState } from "react";

import type { RegionGroup, SituationRegionValue } from "../model/types";

/**
 * 지역 스텝 상태 (그룹 칩 + 세부 칩 구조).
 *   - activeGroup: 현재 보고 있는 그룹 id (항상 하나)
 *   - activeAreas: activeGroup 의 세부 지역 목록
 *   - selected: 선택한 세부 지역 id (단일 선택). 그룹 전환해도 유지된다.
 *   - isValid: 지역을 하나 골랐는지
 */
export function useRegionStep(
  groups: readonly RegionGroup[],
  initial?: SituationRegionValue,
) {
  const [selected, setSelected] = useState<SituationRegionValue | undefined>(
    initial,
  );

  const initialGroup =
    (initial &&
      groups.find((g) => g.areas.some((a) => a.id === initial.districtId))?.id) ||
    groups[0]?.id;
  const [activeGroup, setActiveGroup] = useState<string | undefined>(
    initialGroup,
  );

  const activeAreas = useMemo(
    () => groups.find((g) => g.id === activeGroup)?.areas ?? [],
    [activeGroup, groups],
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
