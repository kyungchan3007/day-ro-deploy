import "server-only";

import type { SituationFlowStep } from "../model/flow";
import type { PopularRegionKeyword, RegionGroup } from "../model/types";
import {
  buildCourseRouteUrl,
  parseCourseRoute,
  type CourseNewSearchParams,
} from "../model/url-state";
import { getInitialRegionData } from "./get-initial-region-groups";

export interface CourseNewPageData {
  step: SituationFlowStep;
  /** 화면 상태 스냅샷 키. 실제 조건·후보는 클라이언트 흐름 상태에서 복원한다. */
  rev?: string;
  regionGroups: RegionGroup[];
  popularRegionKeywords: PopularRegionKeyword[];
}

export type CourseNewPageResult =
  | { kind: "render"; data: CourseNewPageData }
  /** step·rev·유입 키 외 쿼리(레거시 상태 쿼리 등)가 있으면 유입 키만 남기고 time 으로 정리한다. */
  | { kind: "redirect"; url: string };

/**
 * `/course/new` 서버 엔트리 데이터 준비 함수 (issue #129).
 *
 * 주소에는 step·rev 만 있으므로 서버는 단계 정규화와 지역 기준정보만 준비한다.
 * 조회·복원 경로에서는 코스 생성(submitSituation)을 절대 호출하지 않는다 — 생성은 사용자 명령으로만 시작한다.
 * @param searchParams 페이지 searchParams.
 * @returns 렌더 데이터 또는 주소 정리(redirect) 지시.
 */
export async function getCourseNewPageData(
  searchParams: CourseNewSearchParams,
): Promise<CourseNewPageResult> {
  const route = parseCourseRoute(searchParams);
  if (!route.isClean) {
    return {
      kind: "redirect",
      url: buildCourseRouteUrl({ step: "time", attribution: route.attribution }),
    };
  }

  // 지역 선택 화면과 그 직전(time) 단계에서만 지역 목록·인기 검색어를 서버에서 준비한다.
  const shouldLoadRegionData = route.step === "time" || route.step === "region";
  const initialRegionData = shouldLoadRegionData ? await getInitialRegionData() : null;

  return {
    kind: "render",
    data: {
      step: route.step,
      rev: route.rev,
      regionGroups: initialRegionData?.groups ?? [],
      popularRegionKeywords:
        initialRegionData?.popularKeywords.map((keyword) => ({
          id: keyword.districtIds[0] ?? keyword.name,
          label: keyword.name,
          dong: keyword.dong,
          districtIds: keyword.districtIds,
        })) ?? [],
    },
  };
}
