import type { CourseCandidateResponse } from "../../../shared/api/openapi/dayro.openapi";

export const LAST_GENERATED_COURSE_STORAGE_KEY =
  "dayro:last-generated-course-candidates";

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
