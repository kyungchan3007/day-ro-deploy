import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";

/**
 * 코스 장소 순서 규칙 — 순수 로직 (features/course-map).
 *
 * 드래그앤드롭 재정렬은 배열 순서만 바꾸면 되고(지도 마커/경로선은 순서에서 파생),
 * 원래 순서 복원과 "변경됨" 판정을 위해 순서/집합 비교를 함께 제공한다.
 */

/**
 * from 위치의 항목을 to 위치로 옮긴 새 배열을 반환한다(원본 불변).
 * 인덱스가 범위를 벗어나면 원본 복사본을 그대로 반환한다.
 */
export function reorderPlaces(
  places: readonly PlaceCandidate[],
  from: number,
  to: number,
): PlaceCandidate[] {
  const next = [...places];
  if (
    from < 0 ||
    from >= next.length ||
    to < 0 ||
    to >= next.length ||
    from === to
  ) {
    return next;
  }

  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** 두 배열의 순서(placeId 시퀀스)가 완전히 같은지. */
export function isSameOrder(
  a: readonly PlaceCandidate[],
  b: readonly PlaceCandidate[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((place, index) => place.placeId === b[index].placeId);
}

/** 두 배열이 같은 장소 집합(순서 무관)인지 — 저장된 순서가 이 코스 것인지 판별용. */
export function isSamePlaceSet(
  a: readonly PlaceCandidate[],
  b: readonly PlaceCandidate[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const idsB = new Set(b.map((place) => place.placeId));
  return a.every((place) => idsB.has(place.placeId));
}
