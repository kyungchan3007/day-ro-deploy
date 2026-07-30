import {
  courseCandidateResponseSchema,
  type CourseCandidateResponse,
  type PlaceCandidate,
} from "../../../shared/api/openapi/dayro.openapi";

/** 마지막으로 생성된 코스 후보(로딩 → 결과 화면 브릿지). */
export const LAST_GENERATED_COURSE_STORAGE_KEY =
  "dayro:last-generated-course-candidates";

/** 결과 화면에서 확정한 선택 순서(코스 → 다음 단계 브릿지). */
export const SELECTED_COURSE_STORAGE_KEY = "dayro:selected-course-places";

/**
 * 생성된 코스 후보를 sessionStorage 에 저장한다.
 * @param response situations 응답(후보 목록).
 */
export function saveLastGeneratedCourseCandidates(
  response: CourseCandidateResponse,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    LAST_GENERATED_COURSE_STORAGE_KEY,
    JSON.stringify(response),
  );
}

/**
 * 저장된 코스 후보를 읽어 계약(schema)으로 검증해 반환한다.
 * 값이 없거나 형식이 깨졌으면 null(결과 화면은 빈 결과로 안전 처리).
 * @returns 후보 응답 | null
 */
export function readLastGeneratedCourseCandidates(): CourseCandidateResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(LAST_GENERATED_COURSE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return courseCandidateResponseSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * 결과 화면에서 확정한 선택 순서를 다음 단계가 소비하도록 저장한다.
 * (다음 화면 라우팅이 아직 없어 스토리지로 브릿지한다.)
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
