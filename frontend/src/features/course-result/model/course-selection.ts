import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";

/**
 * 코스(장소) 선택 규칙 — 순수 로직.
 *
 * MIN/MAX 는 기준 HTML/기획에서 온 UX 상수(임의 비즈니스 규칙 아님)다.
 * 상태 훅(useCourseSelection)이 이 함수들을 감싸 React 상태로 노출한다.
 */

/** 코스 확정에 필요한 최소 장소 수. */
export const MIN_REQUIRED_PLACES = 4;
/** 선택 가능한 최대 장소 수(순서 스트립 슬롯 개수와 동일). */
export const MAX_SELECTABLE_PLACES = 5;

/**
 * 선택 토글: 이미 선택돼 있으면 제거(뒤 항목이 앞으로 당겨져 순서 자동 재정렬),
 * 아니면 max 미만일 때만 뒤에 추가한다.
 * @param selected 현재 선택된 후보(선택 순서대로).
 * @param place 토글 대상 후보.
 * @param max 최대 선택 개수.
 * @returns 새 선택 배열(원본 불변).
 */
export function toggleSelection(
  selected: readonly PlaceCandidate[],
  place: PlaceCandidate,
  max: number = MAX_SELECTABLE_PLACES,
): PlaceCandidate[] {
  const index = selected.findIndex((p) => p.placeId === place.placeId);
  if (index > -1) {
    return selected.filter((_, i) => i !== index);
  }
  if (selected.length >= max) {
    return [...selected];
  }
  return [...selected, place];
}

/**
 * 선택 순번(1-based)을 반환한다. 미선택이면 undefined.
 */
export function selectionOrderOf(
  selected: readonly PlaceCandidate[],
  placeId: string,
): number | undefined {
  const index = selected.findIndex((p) => p.placeId === placeId);
  return index > -1 ? index + 1 : undefined;
}

/** CTA(선택완료) 활성화 여부. */
export function isSelectionValid(count: number): boolean {
  return count >= MIN_REQUIRED_PLACES;
}

/** 최대 선택 도달 여부(미선택 카드 비활성 판단용). */
export function isSelectionFull(
  count: number,
  max: number = MAX_SELECTABLE_PLACES,
): boolean {
  return count >= max;
}

/** 선택 상태에 따른 안내(hint) 문구. */
export function selectionHint(count: number): string {
  return count === 0
    ? `최소 ${MIN_REQUIRED_PLACES}곳을 선택해야해요`
    : "다시 탭하면 선택이 해제돼요";
}
