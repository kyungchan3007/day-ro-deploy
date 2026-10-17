/**
 * situation feature public API.
 * 슬라이스 외부(widgets/app)는 이 배럴을 통해서만 접근한다.
 * (WheelColumn 등 내부 구현 조각은 노출하지 않는다.)
 */
export { TimeRangeField } from "./ui/TimeRangeField";
export type { TimeRangeFieldProps } from "./ui/TimeRangeField";
export { TimeWheel } from "./ui/TimeWheel";
export type { TimeWheelProps } from "./ui/TimeWheel";
export { RegionAreaSearch } from "./ui/RegionAreaSearch";
export type { RegionAreaSearchProps } from "./ui/RegionAreaSearch";
export { PurposeOptionGrid } from "./ui/PurposeOptionGrid";
export type { PurposeOptionGridProps } from "./ui/PurposeOptionGrid";
export { PlaceCountStepper } from "./ui/PlaceCountStepper";
export type { PlaceCountStepperProps } from "./ui/PlaceCountStepper";
export { SituationSummary } from "./ui/SituationSummary";
export type { SituationSummaryProps } from "./ui/SituationSummary";
export { SituationStepGuide } from "./ui/SituationStepGuide";
export type { SituationStepGuideProps } from "./ui/SituationStepGuide";
export { SituationSelectionTicker } from "./ui/SituationSelectionTicker";
export { SituationLoadingStatus } from "./ui/SituationLoadingStatus";
export type { SituationLoadingStatusProps } from "./ui/SituationLoadingStatus";
export type { SituationSelectionTickerProps } from "./ui/SituationSelectionTicker";

export { useTimeRangeStep } from "./hooks/useTimeRangeStep";
export { usePlaceCountStep } from "./hooks/usePlaceCountStep";
export { useRegionStep } from "./hooks/useRegionStep";
export { usePurposeStep } from "./hooks/usePurposeStep";
export { useCourseGeneration } from "./hooks/useCourseGeneration";
export type { UseCourseGenerationResult } from "./hooks/useCourseGeneration";
export { COURSE_RETRY_LIMIT, isRetryExhausted } from "./model/retry-policy";
export { requestCourseCandidates } from "./api/submit";
export type {
  GenerationApiStatus,
  GenerationPhase,
} from "./model/course-generation";
export { buildRegionGroupsFromResponse } from "./model/region-groups";
// region-search 조각 · MIN_LOADING_MS · resolveGenerationPhase · CourseReadyCue/CourseFlowRestore 타입은
// 슬라이스 밖 사용처가 없어 배럴에서 뺐다(구현은 슬라이스 내부에서 계속 쓴다, issue #229).
export {
  isSituationStepKey,
  SITUATION_LOADING_STEP,
  SITUATION_RESULT_STEP,
  SITUATION_COURSE_STEP,
  SITUATION_STEPS,
  TOTAL_SITUATION_STEPS,
  resolveSituationStep,
  getSituationStepIndex,
  getSituationNextLabel,
  getPreviousSituationStep,
  getNextSituationStep,
  patchSituationAnswers,
} from "./model/flow";
export { buildSituationRequest } from "./model/request";
export {
  buildCourseRouteUrl,
  getFirstIncompleteSituationStep,
  hasCompleteSituationAnswers,
  parseCourseRoute,
} from "./model/url-state";
export {
  createCourseFlowOperationId,
  resolveCourseFlowFallbackStep,
} from "./model/course-flow";
export type {
  CourseFlowOperationRef,
  CourseFlowSnapshot,
  CourseFlowSnapshotInput,
} from "./model/course-flow";
export { recordCourseFlowSnapshot } from "./lib/course-flow-storage";
export { useCourseFlowLoginHandoff } from "./hooks/useCourseFlowLoginHandoff";
export { useCourseFlowSnapshot } from "./hooks/useCourseFlowSnapshot";
export { useCourseReadyCue } from "./hooks/useCourseReadyCue";
export type {
  PopularRegionKeyword,
  Time,
  TimeRange,
  TimeField,
  Meridiem,
  RegionArea,
  RegionGroup,
  RegionGroupOption,
  RegionSearchMatch,
  RegionResultRow,
  SituationRegionValue,
  TransportChoice,
  TransportSelection,
  PurposeChoice,
  SituationAnswers,
} from "./model/types";
export type { SituationFlowStep, SituationStepKey } from "./model/flow";
export type {
  CourseNewSearchParams,
  ParsedCourseRoute,
} from "./model/url-state";
export {
  situationOpenApi,
  situationPurposeSchema,
  situationInputRequestSchema,
  placeCandidateSchema,
  courseCandidateResponseDataSchema,
  regionItemSchema,
  regionResponseItemSchema,
  courseCandidateResponseSchema,
  regionsResponseSchema,
} from "@/shared/api/openapi/dayro.openapi";
export type {
  SituationPurpose,
  SituationInputRequest,
  PlaceCandidate,
  CourseCandidateResponseData,
  CourseCandidateResponse,
  RegionItem,
  RegionResponseItem,
  RegionsResponse,
} from "@/shared/api/openapi/dayro.openapi";
