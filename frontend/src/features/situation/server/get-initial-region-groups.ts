import { buildRegionGroupsFromResponse } from "../model/region-groups";
import { getSituationRegions } from "../../../shared/api/server-situation";

/**
 * `course/new` 초기 렌더에 필요한 지역 선택지를 서버에서 준비한다.
 * 공통 서버 계약 계층에서 지역 응답을 받은 뒤, 위젯이 바로 쓸 수 있는 `RegionGroup[]` 으로 변환한다.
 */
export async function getInitialRegionGroups() {
  const regions = await getSituationRegions();

  return buildRegionGroupsFromResponse(regions.data);
}
