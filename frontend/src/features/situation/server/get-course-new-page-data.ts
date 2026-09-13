import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import { submitSituation } from "../../../shared/api/server-situation";

import { type SituationFlowStep } from "../model/flow";
import { buildSituationRequest } from "../model/request";
import { normalizeSituationRegionValue } from "../model/region-search";
import type {
  PopularRegionKeyword,
  RegionGroup,
  SituationAnswers,
} from "../model/types";
import {
  getFirstIncompleteSituationStep,
  hasCompleteSituationAnswers,
  parseCourseRouteState,
  type CourseNewSearchParams,
} from "../model/url-state";
import { SITUATION_RESULT_STEP } from "../model/flow";
import { getInitialRegionData } from "./get-initial-region-groups";

export interface CourseNewPageData {
  step: SituationFlowStep;
  answers: SituationAnswers;
  regionGroups: RegionGroup[];
  popularRegionKeywords: PopularRegionKeyword[];
  candidates: PlaceCandidate[];
  selectedPlaces: PlaceCandidate[];
  candidateRequestId?: string;
  remainingRetries?: number;
}

function restoreSelectedPlaces(
  candidates: readonly PlaceCandidate[],
  selectedPlaceIds: readonly string[],
): PlaceCandidate[] {
  if (selectedPlaceIds.length === 0) {
    return [];
  }

  const candidateMap = new Map(
    candidates.map((candidate) => [candidate.placeId, candidate] as const),
  );

  return selectedPlaceIds
    .map((placeId) => candidateMap.get(placeId))
    .filter((candidate): candidate is PlaceCandidate => candidate != null);
}

/**
 * `/course/new` 서버 엔트리 데이터 준비 함수.
 * URL query를 읽어 현재 step을 정규화하고, 필요한 경우 지역 목록/추천 결과를 서버에서 선준비한다.
 */
export async function getCourseNewPageData(
  searchParams: CourseNewSearchParams,
): Promise<CourseNewPageData> {
  const route = parseCourseRouteState(searchParams);
  const shouldLoadRegionGroups =
    route.answers.region != null || route.step === "region" || route.step === "time";
  const initialRegionData = shouldLoadRegionGroups
    ? await getInitialRegionData()
    : null;
  const regionGroups = initialRegionData?.groups ?? [];
  const popularRegionKeywords =
    initialRegionData?.popularKeywords.map((keyword) => ({
      id: keyword.districtIds[0] ?? keyword.name,
      label: keyword.name,
      dong: keyword.dong,
      districtIds: keyword.districtIds,
    })) ?? [];
  const answers = normalizeSituationAnswers(route.answers, regionGroups);
  const incompleteStep = getFirstIncompleteSituationStep(answers);

  if (incompleteStep) {
    return {
      step: incompleteStep,
      answers,
      regionGroups,
      popularRegionKeywords,
      candidates: [],
      selectedPlaces: [],
      candidateRequestId: undefined,
      remainingRetries: undefined,
    };
  }

  if (route.step === "loading") {
    return {
      step: "loading",
      answers,
      regionGroups: [],
      popularRegionKeywords: [],
      candidates: [],
      selectedPlaces: [],
      candidateRequestId: route.requestId,
      remainingRetries: undefined,
    };
  }

  if (route.step === "result" || route.step === "course") {
    if (route.step === "result" && route.candidatePlaces.length > 0) {
      return {
        step: SITUATION_RESULT_STEP,
        answers,
        regionGroups: [],
        popularRegionKeywords: [],
        candidates: route.candidatePlaces,
        selectedPlaces: [],
        candidateRequestId: route.requestId,
        remainingRetries: undefined,
      };
    }

    if (route.step === "course" && route.selectedPlaces.length > 0) {
      return {
        step: "course",
        answers,
        regionGroups: [],
        popularRegionKeywords: [],
        candidates: route.candidatePlaces,
        selectedPlaces: route.selectedPlaces,
        candidateRequestId: route.requestId,
        remainingRetries: undefined,
      };
    }

    const response = await submitSituation(buildSituationRequest(answers));
    const { places: candidates, requestId, remainingRetries } = response.data;

    if (route.step === "course") {
      return {
        step: "course",
        answers,
        regionGroups: [],
        popularRegionKeywords: [],
        candidates,
        selectedPlaces:
          route.candidatePlaces.length > 0
            ? restoreSelectedPlaces(route.candidatePlaces, route.selectedPlaceIds)
            : restoreSelectedPlaces(candidates, route.selectedPlaceIds),
        candidateRequestId: route.requestId ?? requestId,
        remainingRetries,
      };
    }

    return {
      step: SITUATION_RESULT_STEP,
      answers,
      regionGroups: [],
      popularRegionKeywords: [],
      candidates,
      selectedPlaces: [],
      candidateRequestId: requestId,
      remainingRetries,
    };
  }

  return {
    step: hasCompleteSituationAnswers(answers) ? route.step : "time",
    answers,
    regionGroups,
    popularRegionKeywords,
    candidates: [],
    selectedPlaces: [],
    candidateRequestId: undefined,
    remainingRetries: undefined,
  };
}

/**
 * URL에 담긴 지역값을 현재 backend 지역 목록 기준으로 복원한다.
 * stale districtId는 최신 id로 교체하고, 복원 불가능하면 region 답변 자체를 제거해 재선택 단계로 돌린다.
 */
function normalizeSituationAnswers(
  answers: SituationAnswers,
  regionGroups: readonly RegionGroup[],
): SituationAnswers {
  if (!answers.region) {
    return answers;
  }

  const normalizedRegion = normalizeSituationRegionValue(regionGroups, answers.region);
  if (!normalizedRegion) {
    return {
      ...answers,
      region: undefined,
    };
  }

  return {
    ...answers,
    region: normalizedRegion,
  };
}
