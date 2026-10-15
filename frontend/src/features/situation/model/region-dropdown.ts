import { filterRegionAreas } from "./region-search";
import type { RegionArea, SituationRegionValue } from "./types";

/**
 * 지역 단계 동네 드롭다운 규칙 (QA #2, issue #208).
 *
 * 동네 칸은 검색창 겸 드롭다운이다. 칸 글자는 고른 동 이름을 보여주기도 하고 검색어이기도 하다.
 */

/** 동네 드롭다운 본문 상태. */
export type RegionResultsState =
  /** 구를 골랐고 검색어가 없음: 그 구의 동네 전체. */
  | "list"
  /** 검색어로 좁힌 결과. */
  | "search"
  /** 구를 고르지 않았고 검색어도 없음: 구 선택 · 검색 안내. */
  | "hint"
  /** 검색했지만 결과 없음. */
  | "empty";

/**
 * 실제로 목록을 좁힐 검색어.
 * 칸 글자가 고른 동 이름 그대로면(선택 직후 · 뒤로가기 복원) 필터하지 않아, 다시 열었을 때 전체 목록이 보인다.
 */
export function getRegionFilterQuery(
  query: string,
  selected: SituationRegionValue | undefined,
): string {
  return selected && query.trim() === selected.label ? "" : query;
}

/**
 * 칸 글자를 고치는 중인지(모바일에서 커서를 옮기려는 탭을 "접기"로 처리하지 않기 위함).
 * 비어 있거나 고른 동 이름 그대로면 고치는 중이 아니다.
 */
export function isEditingRegionQuery(query: string, selectedLabel: string | undefined): boolean {
  const text = query.trim();
  return text.length > 0 && text !== selectedLabel;
}

/** 구-스코프 목록. 빈 검색어면 그 구의 동네 전체, 아니면 이름 · 행정동으로 좁힌다. */
export function listRegionAreas(
  areas: readonly RegionArea[],
  query: string,
): readonly RegionArea[] {
  return query.trim().length === 0 ? areas : filterRegionAreas(areas, query);
}

/** 드롭다운 본문 상태 판단. */
export function getRegionResultsState({
  scoped,
  filterQuery,
  resultCount,
}: {
  scoped: boolean;
  filterQuery: string;
  resultCount: number;
}): RegionResultsState {
  const searching = filterQuery.trim().length > 0;
  if (!searching) {
    return scoped ? "list" : "hint";
  }
  return resultCount > 0 ? "search" : "empty";
}

export interface RegionHighlightPart {
  text: string;
  match: boolean;
}

/**
 * 결과 행 이름에서 검색어와 일치하는 부분을 나눈다(대소문자 무시).
 * 띄어쓰기를 무시한 별칭 매칭 등으로 이름에 그대로 없으면 강조 없이 통째로 돌려준다.
 */
export function splitRegionHighlight(label: string, query: string): RegionHighlightPart[] {
  const term = query.trim();
  if (!term) {
    return [{ text: label, match: false }];
  }
  const index = label.toLowerCase().indexOf(term.toLowerCase());
  if (index < 0) {
    return [{ text: label, match: false }];
  }
  return [
    { text: label.slice(0, index), match: false },
    { text: label.slice(index, index + term.length), match: true },
    { text: label.slice(index + term.length), match: false },
  ].filter((part) => part.text.length > 0);
}
