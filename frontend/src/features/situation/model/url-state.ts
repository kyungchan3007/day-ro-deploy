import * as z from "zod/mini";
import {
  placeCandidateSchema,
  type PlaceCandidate,
} from "../../../shared/api/openapi/dayro.openapi";
import type {
  PurposeChoice,
  SituationAnswers,
  SituationRegionValue,
  Time,
  TimeRange,
} from "./types";
import {
  SITUATION_LOADING_STEP,
  SITUATION_COURSE_STEP,
  SITUATION_RESULT_STEP,
  resolveSituationStep,
  type SituationFlowStep,
  type SituationStepKey,
} from "./flow";

export interface CourseNewSearchParams {
  [key: string]: string | string[] | undefined;
}

export interface ParsedCourseRouteState {
  step: SituationFlowStep;
  answers: SituationAnswers;
  requestId?: string;
  retryKey?: string;
  selectedPlaceIds: string[];
  selectedPlaces: PlaceCandidate[];
  candidatePlaces: PlaceCandidate[];
}

export interface BuildCourseRouteOptions {
  step: SituationFlowStep;
  answers?: SituationAnswers;
  requestId?: string;
  retryKey?: string;
  selectedPlaceIds?: readonly string[];
  selectedPlaces?: readonly PlaceCandidate[];
  candidatePlaces?: readonly PlaceCandidate[];
}

const COURSE_ROUTE_PATH = "/course/new/";
const PURPOSE_SET = new Set<PurposeChoice>([
  "date",
  "blind",
  "friends",
  "anniversary",
]);
const MERIDIEM_SET = new Set<Time["meridiem"]>(["오전", "오후"]);

function pickParam(
  searchParams: URLSearchParams | CourseNewSearchParams,
  key: string,
): string | undefined {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseInteger(
  searchParams: URLSearchParams | CourseNewSearchParams,
  key: string,
): number | null {
  const raw = pickParam(searchParams, key);
  if (!raw) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTimeValue(
  searchParams: URLSearchParams | CourseNewSearchParams,
  prefix: "start" | "end",
): Time | undefined {
  const meridiem = pickParam(searchParams, `${prefix}Meridiem`);
  const hour = parseInteger(searchParams, `${prefix}Hour`);
  const minute = parseInteger(searchParams, `${prefix}Minute`);

  if (!meridiem || hour == null || minute == null) {
    return undefined;
  }
  if (!MERIDIEM_SET.has(meridiem as Time["meridiem"])) {
    return undefined;
  }
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return undefined;
  }

  return {
    meridiem: meridiem as Time["meridiem"],
    hour,
    minute,
  };
}

function parseTimeRange(
  searchParams: URLSearchParams | CourseNewSearchParams,
): TimeRange | undefined {
  const start = parseTimeValue(searchParams, "start");
  const end = parseTimeValue(searchParams, "end");

  if (!start || !end) {
    return undefined;
  }

  return { start, end };
}

function parseRegionValue(
  searchParams: URLSearchParams | CourseNewSearchParams,
): SituationRegionValue | undefined {
  const districtId = pickParam(searchParams, "districtId");
  const label = pickParam(searchParams, "regionLabel");

  if (!districtId || !label) {
    return undefined;
  }

  return {
    districtId,
    label,
    dong: pickParam(searchParams, "regionDong"),
    categoryId: pickParam(searchParams, "regionCategoryId"),
    categoryLabel: pickParam(searchParams, "regionCategoryLabel"),
  };
}

function parsePurposeChoice(
  searchParams: URLSearchParams | CourseNewSearchParams,
): PurposeChoice | undefined {
  const purpose = pickParam(searchParams, "purpose");
  return purpose && PURPOSE_SET.has(purpose as PurposeChoice)
    ? (purpose as PurposeChoice)
    : undefined;
}

function parseSelectedPlaceIds(
  searchParams: URLSearchParams | CourseNewSearchParams,
): string[] {
  const raw = pickParam(searchParams, "selectedPlaceIds");
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);
}

function parseSelectedPlaces(
  searchParams: URLSearchParams | CourseNewSearchParams,
): PlaceCandidate[] {
  return parsePlaceCandidatesParam(searchParams, "selectedPlaces");
}

function parseCandidatePlaces(
  searchParams: URLSearchParams | CourseNewSearchParams,
): PlaceCandidate[] {
  return parsePlaceCandidatesParam(searchParams, "candidatePlaces");
}

function parsePlaceCandidatesParam(
  searchParams: URLSearchParams | CourseNewSearchParams,
  key: "selectedPlaces" | "candidatePlaces",
): PlaceCandidate[] {
  const raw = pickParam(searchParams, key);
  if (!raw) {
    return [];
  }

  try {
    return z.array(placeCandidateSchema).parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

function appendTimeParams(params: URLSearchParams, time: TimeRange) {
  params.set("startMeridiem", time.start.meridiem);
  params.set("startHour", String(time.start.hour));
  params.set("startMinute", String(time.start.minute));
  params.set("endMeridiem", time.end.meridiem);
  params.set("endHour", String(time.end.hour));
  params.set("endMinute", String(time.end.minute));
}

function appendRegionParams(params: URLSearchParams, region: SituationRegionValue) {
  params.set("districtId", region.districtId);
  params.set("regionLabel", region.label);

  if (region.dong) {
    params.set("regionDong", region.dong);
  }
  if (region.categoryId) {
    params.set("regionCategoryId", region.categoryId);
  }
  if (region.categoryLabel) {
    params.set("regionCategoryLabel", region.categoryLabel);
  }
}

function appendPurposeParams(params: URLSearchParams, purpose: PurposeChoice) {
  params.set("purpose", purpose);
}

/**
 * `/course/new` URL 상태를 도메인 응답과 후속 화면 선택값으로 복원한다.
 * 서버(page)와 클라이언트(router push)가 같은 파서를 공유하도록 한곳에 둔다.
 */
export function parseCourseRouteState(
  searchParams: URLSearchParams | CourseNewSearchParams,
): ParsedCourseRouteState {
  const step = resolveSituationStep(pickParam(searchParams, "step"));
  const time = parseTimeRange(searchParams);
  const region = parseRegionValue(searchParams);
  const purpose = parsePurposeChoice(searchParams);

  return {
    step,
    answers: {
      ...(time ? { time } : {}),
      ...(region ? { region } : {}),
      ...(purpose ? { purpose } : {}),
    },
    requestId: pickParam(searchParams, "requestId"),
    retryKey: pickParam(searchParams, "retry"),
    selectedPlaceIds: parseSelectedPlaceIds(searchParams),
    selectedPlaces: parseSelectedPlaces(searchParams),
    candidatePlaces: parseCandidatePlaces(searchParams),
  };
}

/**
 * `/course/new`용 URL을 직렬화한다.
 * 입력 단계와 후속 결과/코스 단계가 같은 쿼리 계약을 쓰도록 보장한다.
 */
export function buildCourseRouteUrl({
  step,
  answers,
  requestId,
  retryKey,
  selectedPlaceIds,
  selectedPlaces,
  candidatePlaces,
}: BuildCourseRouteOptions): string {
  const params = new URLSearchParams();
  params.set("step", step);

  if (answers?.time) {
    appendTimeParams(params, answers.time);
  }
  if (answers?.region) {
    appendRegionParams(params, answers.region);
  }
  if (answers?.purpose) {
    appendPurposeParams(params, answers.purpose);
  }
  if (
    (
      step === SITUATION_LOADING_STEP ||
      step === SITUATION_RESULT_STEP ||
      step === SITUATION_COURSE_STEP
    ) &&
    requestId
  ) {
    params.set("requestId", requestId);
  }
  if (step === SITUATION_LOADING_STEP && retryKey) {
    params.set("retry", retryKey);
  }
  if (
    step === SITUATION_COURSE_STEP &&
    selectedPlaceIds &&
    selectedPlaceIds.length > 0
  ) {
    params.set("selectedPlaceIds", selectedPlaceIds.join(","));
  }
  if (
    step === SITUATION_COURSE_STEP &&
    selectedPlaces &&
    selectedPlaces.length > 0
  ) {
    params.set("selectedPlaces", JSON.stringify(selectedPlaces));
  }
  if (
    (step === SITUATION_RESULT_STEP || step === SITUATION_COURSE_STEP) &&
    candidatePlaces &&
    candidatePlaces.length > 0
  ) {
    params.set("candidatePlaces", JSON.stringify(candidatePlaces));
  }

  return `${COURSE_ROUTE_PATH}?${params.toString()}`;
}

export function getFirstIncompleteSituationStep(
  answers: SituationAnswers,
): SituationStepKey | null {
  if (!answers.time) {
    return "time";
  }
  if (!answers.region) {
    return "region";
  }
  if (!answers.purpose) {
    return "purpose";
  }

  return null;
}

export function hasCompleteSituationAnswers(answers: SituationAnswers): boolean {
  return getFirstIncompleteSituationStep(answers) === null;
}
