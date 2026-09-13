/**
 * saved feature server public API.
 * app route 와 server entry 가 저장 코스 SSR 데이터를 준비할 때만 사용한다.
 */
export { getSavedPageData } from "./get-saved-page-data";
export { getSavedCourseDetailPageData } from "./get-saved-course-detail-page-data";
export { requireSavedAuth } from "./require-saved-auth";
