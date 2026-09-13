import { buildRegionGroupsFromResponse } from "../model/region-groups";
import {
  getSituationPopularKeywords,
  getSituationRegions,
} from "../../../shared/api/server-situation";

export interface InitialRegionData {
  groups: ReturnType<typeof buildRegionGroupsFromResponse>;
  popularKeywords: Awaited<
    ReturnType<typeof getSituationPopularKeywords>
  >["data"];
}

/**
 * `course/new` 초기 렌더에 필요한 지역 선택지와 인기 검색어를 서버에서 준비한다.
 * 공통 서버 계약 계층에서 받은 응답을 위젯이 바로 쓸 수 있는 값으로 정리한다.
 */
export async function getInitialRegionData(): Promise<InitialRegionData> {
  const [regions, popularKeywords] = await Promise.all([
    getSituationRegions(),
    getSituationPopularKeywords(),
  ]);

  return {
    groups: buildRegionGroupsFromResponse(regions.data),
    popularKeywords: popularKeywords.data,
  };
}
