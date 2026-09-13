import {
  courseCandidateResponseSchema,
  type CourseCandidateResponse,
} from "../../../shared/api/openapi/dayro.openapi";

/** 마지막으로 생성된 코스 후보(로딩 → 결과 화면 브릿지). */
export const LAST_GENERATED_COURSE_STORAGE_KEY =
  "dayro:last-generated-course-candidates";

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
