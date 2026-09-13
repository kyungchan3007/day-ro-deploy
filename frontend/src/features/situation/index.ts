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
export { TransportCardGroup } from "./ui/TransportCardGroup";
export type { TransportCardGroupProps } from "./ui/TransportCardGroup";
export { PurposeOptionGrid } from "./ui/PurposeOptionGrid";
export type { PurposeOptionGridProps } from "./ui/PurposeOptionGrid";
export { SituationSummary } from "./ui/SituationSummary";
export type { SituationSummaryProps } from "./ui/SituationSummary";
export { SituationStepGuide } from "./ui/SituationStepGuide";
export type { SituationStepGuideProps } from "./ui/SituationStepGuide";
export { SituationSelectionTicker } from "./ui/SituationSelectionTicker";
export type { SituationSelectionTickerProps } from "./ui/SituationSelectionTicker";

export { useTimeRangeStep } from "./hooks/useTimeRangeStep";
export { useRegionStep } from "./hooks/useRegionStep";
export { useTransportStep } from "./hooks/useTransportStep";
export { usePurposeStep } from "./hooks/usePurposeStep";
export { useCourseGeneration } from "./hooks/useCourseGeneration";
export type { UseCourseGenerationResult } from "./hooks/useCourseGeneration";
export { requestCourseCandidates } from "./api/submit";
export {
  MIN_LOADING_MS,
  resolveGenerationPhase,
} from "./model/course-generation";
export type {
  GenerationApiStatus,
  GenerationPhase,
} from "./model/course-generation";
export { buildRegionGroupsFromResponse } from "./model/region-groups";
export {
  buildRegionSearchMatches,
  buildPopularRegionKeywords,
  searchRegionMatches,
  filterRegionAreas,
  toSituationRegionValue,
  findRegionMatchByDistrictId,
  findRegionMatchByLabel,
  findRegionValueByAreaId,
  getRegionGroupAreas,
  normalizeSituationRegionValue,
} from "./model/region-search";
export {
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
  parseCourseRouteState,
} from "./model/url-state";
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
  BuildCourseRouteOptions,
  CourseNewSearchParams,
  ParsedCourseRouteState,
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
