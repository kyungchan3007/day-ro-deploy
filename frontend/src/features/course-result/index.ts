/**
 * course-result feature public API.
 * 추천 결과 선택/재추천 흐름만 노출한다.
 */
export { useCourseSelection } from "./hooks/useCourseSelection";
export { useRestoredCourseCandidates } from "./hooks/useRestoredCourseCandidates";
export { useCourseResult } from "./hooks/useCourseResult";
export { readLastGeneratedCourseCandidates } from "./lib/generated-course-storage";
export {
  MIN_REQUIRED_PLACES,
  MAX_SELECTABLE_PLACES,
  toggleSelection,
  selectionOrderOf,
  isSelectionValid,
  isSelectionFull,
  selectionHint,
} from "./model/course-selection";
export type {
  UseCourseResultOptions,
  UseCourseResultValue,
} from "./hooks/useCourseResult";
