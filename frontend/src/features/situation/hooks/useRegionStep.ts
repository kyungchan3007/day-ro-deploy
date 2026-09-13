"use client";

import { useDeferredValue, useMemo, useState } from "react";

import type {
  PopularRegionKeyword,
  RegionGroup,
  RegionGroupOption,
  RegionResultRow,
  SituationRegionValue,
} from "../model/types";
import {
  buildPopularRegionKeywords,
  filterRegionAreas,
  findRegionValueByAreaId,
  getRegionGroupAreas,
  normalizeSituationRegionValue,
  resolvePopularRegionKeyword,
  searchRegionMatches,
} from "../model/region-search";

const NO_GU_VALUE = "";

/**
 * 지역 스텝 상태 (그룹 칩 + 세부 칩 + 검색 구조).
 *   - activeGroup: 현재 보고 있는 그룹 id. 없으면 전역 검색 모드다.
 *   - selected: 선택한 세부 지역 id (단일 선택). 그룹 전환해도 유지된다.
 *   - groupOptions/results/caption: widget 가 그대로 렌더할 화면용 view-model.
 *   - isValid: 지역을 하나 골랐는지
 */
export function useRegionStep(
  groups: readonly RegionGroup[],
  popularKeywords: readonly PopularRegionKeyword[],
  initial?: SituationRegionValue,
) {
  const initialMatch = initial ? normalizeSituationRegionValue(groups, initial) : undefined;
  const [selected, setSelected] = useState<SituationRegionValue | undefined>(
    initialMatch,
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // 신규 진입은 "선택 안 함"(undefined)으로 시작해 전역 검색을 기본으로 한다.
  // 뒤로 와서 복원할 때만 이전 구를 활성화한다.
  const initialGroup = initialMatch?.categoryId ?? initial?.categoryId;
  const [activeGroup, setActiveGroup] = useState<string | undefined>(
    initialGroup,
  );

  const activeAreas = useMemo(
    () => getRegionGroupAreas(groups, activeGroup),
    [activeGroup, groups],
  );
  /** 선택한 구 안에서 검색어로 좁힌 목록(구-스코프 검색). 리스트 렌더에 사용. */
  const visibleAreas = useMemo(
    () => filterRegionAreas(activeAreas, deferredQuery),
    [activeAreas, deferredQuery],
  );
  const searchMatches = useMemo(
    () => searchRegionMatches(groups, deferredQuery),
    [deferredQuery, groups],
  );
  const groupOptions = useMemo<RegionGroupOption[]>(
    () => [
      { value: NO_GU_VALUE, label: "선택 안 함" },
      ...groups.map((group) => ({ value: group.id, label: group.label })),
    ],
    [groups],
  );
  const activeGroupLabel = groups.find((group) => group.id === activeGroup)?.label;
  const normalizedPopularKeywords = useMemo(
    () => buildPopularRegionKeywords(groups, popularKeywords),
    [groups, popularKeywords],
  );
  const scoped = activeGroup != null;
  const results = useMemo<RegionResultRow[]>(
    () =>
      scoped
        ? visibleAreas.map((area) => ({
            id: area.id,
            label: area.label,
            regionLabel: activeGroupLabel,
          }))
        : searchMatches.map((match) => ({
            id: match.area.id,
            label: match.area.label,
            regionLabel: match.groupLabel,
          })),
    [activeGroupLabel, scoped, searchMatches, visibleAreas],
  );
  const resultsCaption =
    scoped && activeGroupLabel ? `${activeGroupLabel} 동네` : undefined;
  const showPopularKeywords = deferredQuery.trim().length === 0;

  const isValid = selected != null;

  const selectArea = (areaId: string) => {
    const next = findRegionValueByAreaId(groups, areaId);
    if (!next) {
      return;
    }

    if (next.categoryId) {
      setActiveGroup(next.categoryId);
    }
    setSelected(next);
  };

  const applyPopularKeyword = (keyword: PopularRegionKeyword) => {
    const next = resolvePopularRegionKeyword(groups, keyword);
    setActiveGroup(next?.categoryId);
    setSelected(next);
    setQuery(keyword.label);
  };

  return {
    selected,
    activeGroup,
    setActiveGroup,
    noGroupValue: NO_GU_VALUE,
    groupOptions,
    query,
    setQuery,
    results,
    resultsCaption,
    popularKeywords: normalizedPopularKeywords,
    showPopularKeywords,
    applyPopularKeyword,
    selectArea,
    isValid,
  };
}
