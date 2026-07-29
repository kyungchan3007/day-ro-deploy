/**
 * situation feature public API.
 * 슬라이스 외부(widgets/app)는 이 배럴을 통해서만 접근한다.
 * (WheelColumn 등 내부 구현 조각은 노출하지 않는다.)
 */
export { TimeRangeField } from "./ui/TimeRangeField";
export type { TimeRangeFieldProps } from "./ui/TimeRangeField";
export { TimeWheel } from "./ui/TimeWheel";
export type { TimeWheelProps } from "./ui/TimeWheel";
export { RegionGroupChips, RegionAreaChips } from "./ui/RegionPicker";
export type {
  RegionGroupChipsProps,
  RegionAreaChipsProps,
} from "./ui/RegionPicker";
export { TransportCardGroup } from "./ui/TransportCardGroup";
export type { TransportCardGroupProps } from "./ui/TransportCardGroup";
export { PurposeOptionGrid } from "./ui/PurposeOptionGrid";
export type { PurposeOptionGridProps } from "./ui/PurposeOptionGrid";
export { SituationSummary } from "./ui/SituationSummary";
export type { SituationSummaryProps } from "./ui/SituationSummary";
export { SituationSelectionTicker } from "./ui/SituationSelectionTicker";
export type { SituationSelectionTickerProps } from "./ui/SituationSelectionTicker";

export { useTimeRangeStep } from "./hooks/useTimeRangeStep";
export { useRegionStep } from "./hooks/useRegionStep";
export { useTransportStep } from "./hooks/useTransportStep";
export { usePurposeStep } from "./hooks/usePurposeStep";
export { requestCourseCandidates } from "./api/submit";
export { buildRegionGroupsFromResponse } from "./model/region-groups";
export {
  SITUATION_LOADING_STEP,
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
export type {
  Time,
  TimeRange,
  TimeField,
  Meridiem,
  RegionArea,
  RegionGroup,
  SituationRegionValue,
  TransportChoice,
  TransportSelection,
  PurposeChoice,
  SituationAnswers,
} from "./model/types";
export type { SituationFlowStep, SituationStepKey } from "./model/flow";
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
