import { trackEvent } from "@/shared/analytics";
import type { CourseSaveRequest } from "../../../shared/api/openapi/dayro.openapi";
import { CourseSaveRequestError } from "../api/save-course";

/**
 * 코스 저장 결과 공통 처리 (features/course-map 내부).
 * 바로 저장(useCourseMapScreen) · 로그인 후 이어 저장(useResumePendingCourseSave)이 같은 규칙을 쓰도록 모았다(issue #229).
 */

/** 저장 실패가 로그인 만료(401)인지. */
export function isUnauthorizedSaveError(error: unknown): boolean {
  return error instanceof CourseSaveRequestError && error.status === 401;
}

/** 저장 성공 분석 이벤트. 장소 수만 보낸다(코스명 · 설명은 보내지 않음). */
export function trackCourseSaved(request: CourseSaveRequest): void {
  trackEvent("course_saved", { place_count: request.places.length });
}
