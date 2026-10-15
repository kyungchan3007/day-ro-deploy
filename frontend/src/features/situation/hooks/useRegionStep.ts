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
  findRegionValueByAreaId,
  getRegionGroupAreas,
  normalizeSituationRegionValue,
  resolvePopularRegionKeyword,
  searchRegionMatches,
} from "../model/region-search";
import {
  isRegionSelectionValid,
  keepRegionSelectionForQuery,
  keepRegionSelectionInGroup,
  restoreRegionQuery,
} from "../model/region-selection";
import {
  getRegionFilterQuery,
  getRegionResultsState,
  listRegionAreas,
  type RegionResultsState,
} from "../model/region-dropdown";

const NO_GU_VALUE = "";

/**
 * 지역 스텝 상태 (그룹 칩 + 세부 칩 + 검색 구조).
 *   - activeGroup: 현재 보고 있는 그룹 id. 없으면 전역 검색 모드다.
 *   - selected: 선택한 세부 지역 id (단일 선택). 구 전환 · 검색어 삭제 시 해제된다(QA #3, issue #168).
 *   - query: 동네 검색어. 뒤로 와서 복원하면 선택한 동 이름으로 채운다.
 *   - groupOptions/results/caption/resultsState: widget 가 그대로 렌더할 화면용 view-model.
 *   - 동네 칸은 검색형 드롭다운(QA #2, issue #208): 고르면 칸 글자 = 동 이름, 다시 열면 전체 목록.
 *   - isValid: 현재 구에 속한 지역을 하나 골랐는지
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
  const [query, setQueryState] = useState(() => restoreRegionQuery(initialMatch));
  // 칸 글자가 고른 동 이름 그대로면 필터하지 않는다(다시 열면 구 동네 전체가 보이게).
  const deferredQuery = useDeferredValue(getRegionFilterQuery(query, selected));

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
  /** 선택한 구의 동네 목록. 빈 검색어면 전체, 아니면 검색어로 좁힌다(구-스코프). */
  const visibleAreas = useMemo(
    () => listRegionAreas(activeAreas, deferredQuery),
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
        ? // 구 안 목록은 구 이름이 이미 위 칸에 보이므로 행에 다시 붙이지 않는다.
          visibleAreas.map((area) => ({ id: area.id, label: area.label }))
        : searchMatches.map((match) => ({
            id: match.area.id,
            label: match.area.label,
            regionLabel: match.groupLabel,
          })),
    [scoped, searchMatches, visibleAreas],
  );
  const resultsState: RegionResultsState = getRegionResultsState({
    scoped,
    filterQuery: deferredQuery,
    resultCount: results.length,
  });
  const resultsCaption =
    resultsState === "list" && activeGroupLabel
      ? `${activeGroupLabel} 동네 ${results.length}곳`
      : resultsState === "search"
        ? `검색 결과 ${results.length}곳`
        : undefined;

  const isValid = isRegionSelectionValid(selected, activeGroup);

  /** 구 드롭다운 전환. 다른 구 · `선택 안 함`이면 동네(검색어 · 선택)를 초기화한다. */
  const changeGroup = (nextGroup: string | undefined) => {
    if (nextGroup === activeGroup) {
      return;
    }
    setActiveGroup(nextGroup);
    setSelected((current) => keepRegionSelectionInGroup(current, nextGroup));
    setQueryState("");
  };

  /** 동네 검색어 입력. 검색어를 지우면 선택도 해제해 다음 단계로 넘어가지 않게 한다. */
  const changeQuery = (nextQuery: string) => {
    setQueryState(nextQuery);
    setSelected((current) => keepRegionSelectionForQuery(current, nextQuery));
  };

  const selectArea = (areaId: string) => {
    const next = findRegionValueByAreaId(groups, areaId);
    if (!next) {
      return;
    }

    // 구를 고르지 않았거나 다른 구였다면 그 동의 구로 맞춘다.
    if (next.categoryId) {
      setActiveGroup(next.categoryId);
    }
    setSelected(next);
    setQueryState(next.label);
  };

  const applyPopularKeyword = (keyword: PopularRegionKeyword) => {
    const next = resolvePopularRegionKeyword(groups, keyword);
    // 지역 목록에서 못 찾은 키워드면 사용자가 고른 구는 그대로 둔다.
    if (next) {
      setActiveGroup(next.categoryId);
    }
    setSelected(next);
    // 칸 글자 = 고른 동 이름(선택 유지 규칙 기준). 지역 목록에서 못 찾으면 키워드 그대로.
    setQueryState(next?.label ?? keyword.label);
  };

  return {
    selected,
    activeGroup,
    setActiveGroup: changeGroup,
    noGroupValue: NO_GU_VALUE,
    groupOptions,
    query,
    setQuery: changeQuery,
    results,
    resultsCaption,
    resultsState,
    /** 결과 행 강조에 쓰는 실제 검색어(선택한 동 이름 그대로면 빈 값). */
    highlightQuery: deferredQuery,
    popularKeywords: normalizedPopularKeywords,
    applyPopularKeyword,
    selectArea,
    isValid,
  };
}
