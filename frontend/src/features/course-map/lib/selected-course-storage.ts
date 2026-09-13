import * as z from "zod/mini";
import {
  placeCandidateSchema,
  type PlaceCandidate,
} from "../../../shared/api/openapi/dayro.openapi";

/** 결과 화면에서 확정한 선택 순서(결과 → 코스 맵 브리지). */
export const SELECTED_COURSE_STORAGE_KEY = "dayro:selected-course-places";

/**
 * 결과 화면에서 확정한 선택 순서를 다음 단계가 소비하도록 저장한다.
 * @param places 선택 순서대로의 후보 배열.
 */
export function saveSelectedCoursePlaces(places: readonly PlaceCandidate[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    SELECTED_COURSE_STORAGE_KEY,
    JSON.stringify({ places }),
  );
}

/**
 * 확정한 선택 순서를 읽어 계약(schema)으로 검증해 반환한다.
 * 값이 없거나 형식이 깨졌으면 빈 배열로 안전 처리한다.
 * @returns 선택 순서대로의 후보 배열.
 */
export function readSelectedCoursePlaces(): PlaceCandidate[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.sessionStorage.getItem(SELECTED_COURSE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = z.array(placeCandidateSchema).parse(JSON.parse(raw).places);
    return parsed;
  } catch {
    return [];
  }
}
