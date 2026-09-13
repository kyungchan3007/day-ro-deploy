"use client";

import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";

export interface UseSelectedCourseValue {
  /** 결과 화면에서 확정한 선택 순서대로의 후보 배열. */
  places: PlaceCandidate[];
  /** 확정된 선택이 없는지(빈 상태 안전 처리용). */
  isEmpty: boolean;
}

/**
 * 확정 코스(지도) 화면 상태 훅 (features/course-map).
 *
 * 서버가 URL query에서 복원해 내려준 선택 순서를 읽기 전용 상태로 노출한다.
 * 화면(위젯)은 URL/저장소를 직접 알지 않고 이 훅만 소비한다.
 *
 * @returns places(선택 순서대로), isEmpty(빈 상태 여부).
 */
export function useSelectedCourse(
  places: readonly PlaceCandidate[],
): UseSelectedCourseValue {
  return { places: [...places], isEmpty: places.length === 0 };
}
