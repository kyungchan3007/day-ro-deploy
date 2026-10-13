import { ATTRIBUTION_QUERY_KEYS } from "@/shared/analytics";
import { resolveSituationStep, type SituationFlowStep, type SituationStepKey } from "./flow";
import type { SituationAnswers } from "./types";

/**
 * `/course/new` 주소 계약 (issue #129, ADR-26).
 *
 * 주소에는 `step` 과 선택적 8자 `rev` 만 둔다. 조건·requestId·후보·선택 장소는
 * 흐름 상태(`model/course-flow`)에 있고 rev 가 그 스냅샷을 가리킨다.
 * 광고 유입 키(UTM·fbclid·gclid)는 첫 진입에서만 함께 올 수 있어 보존한다.
 */

export interface CourseNewSearchParams {
  [key: string]: string | string[] | undefined;
}

export interface ParsedCourseRoute {
  step: SituationFlowStep;
  rev?: string;
  /** step·rev·유입 키 외 쿼리가 없고 각 키가 한 번씩만 있으면 true. false 면 정리 대상. */
  isClean: boolean;
  /** 보존할 유입 키. 정리 redirect 시 그대로 옮긴다. */
  attribution: Record<string, string>;
}

const COURSE_ROUTE_PATH = "/course/new/";
const REV_PATTERN = /^[a-z0-9]{8}$/;
const COURSE_ROUTE_KEYS = new Set(["step", "rev"]);

function toEntries(
  searchParams: URLSearchParams | CourseNewSearchParams,
): [string, string[]][] {
  if (searchParams instanceof URLSearchParams) {
    const grouped = new Map<string, string[]>();
    for (const [key, value] of searchParams) {
      grouped.set(key, [...(grouped.get(key) ?? []), value]);
    }
    return [...grouped.entries()];
  }

  return Object.entries(searchParams)
    .filter((entry): entry is [string, string | string[]] => entry[1] != null)
    .map(([key, value]) => [key, Array.isArray(value) ? value : [value]]);
}

/**
 * `/course/new` 쿼리를 step·rev 로 해석하고 정리 필요 여부를 판정한다.
 * 서버(page)와 클라이언트가 같은 파서를 공유한다.
 * @param searchParams 서버 searchParams 또는 브라우저 URLSearchParams.
 * @returns step(알 수 없으면 time), 형식이 맞는 rev, 정리 여부, 보존할 유입 키.
 */
export function parseCourseRoute(
  searchParams: URLSearchParams | CourseNewSearchParams,
): ParsedCourseRoute {
  const entries = toEntries(searchParams);
  const attribution: Record<string, string> = {};
  let isClean = true;
  let rawStep: string | undefined;
  let rawRev: string | undefined;

  for (const [key, values] of entries) {
    if (values.length !== 1) {
      isClean = false;
    }
    const value = values[0];
    if (key === "step") {
      rawStep = value;
    } else if (key === "rev") {
      rawRev = value;
    } else if (ATTRIBUTION_QUERY_KEYS.includes(key)) {
      attribution[key] = value;
    } else {
      isClean = false;
    }
  }

  const step = resolveSituationStep(rawStep);
  if (rawStep != null && rawStep !== step) {
    isClean = false;
  }
  const rev = rawRev != null && REV_PATTERN.test(rawRev) ? rawRev : undefined;
  if (rawRev != null && !rev) {
    isClean = false;
  }

  return { step, rev, isClean, attribution };
}

/**
 * `/course/new` 주소를 만든다.
 * @param step 이동할 단계.
 * @param rev 화면 상태 스냅샷 키. 최초 입력 단계처럼 스냅샷이 없으면 생략.
 * @param attribution 함께 보존할 유입 키(정리 redirect 용).
 * @returns `/course/new/?step=...&rev=...`
 */
export function buildCourseRouteUrl({
  step,
  rev,
  attribution,
}: {
  step: SituationFlowStep;
  rev?: string;
  attribution?: Record<string, string>;
}): string {
  const params = new URLSearchParams();
  params.set("step", step);
  if (rev) {
    params.set("rev", rev);
  }
  for (const [key, value] of Object.entries(attribution ?? {})) {
    if (!COURSE_ROUTE_KEYS.has(key) && ATTRIBUTION_QUERY_KEYS.includes(key)) {
      params.set(key, value);
    }
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
