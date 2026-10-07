import type {
  PopularRegionKeyword,
  RegionArea,
  RegionGroup,
  RegionSearchMatch,
  SituationRegionValue,
} from "./types";

function normalizeRegionSearchTerm(query: string) {
  return query.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * 지역 그룹/세부 지역 구조를 검색 가능한 평면 목록으로 펼친다.
 * 검색 UI는 이 결과를 사용해 `dong` 또는 `name` 기준 매칭 후 해당 구를 자동 선택할 수 있다.
 */
export function buildRegionSearchMatches(
  groups: readonly RegionGroup[],
): RegionSearchMatch[] {
  return groups.flatMap((group) =>
    group.areas.map((area) => ({
      groupId: group.id,
      groupLabel: group.label,
      area,
    })),
  );
}

/**
 * 지역 검색어를 `name` 과 `dong` 양쪽에 대조해 매칭 결과를 반환한다.
 * 빈 검색어는 노이즈 방지를 위해 결과를 비워서 호출자가 기본 UI를 유지하게 한다.
 */
export function searchRegionMatches(
  groups: readonly RegionGroup[],
  query: string,
): RegionSearchMatch[] {
  const normalizedQuery = normalizeRegionSearchTerm(query);
  if (!normalizedQuery) {
    return [];
  }

  return buildRegionSearchMatches(groups).filter(({ area }) => {
    const normalizedLabel = normalizeRegionSearchTerm(area.label);
    const normalizedDong = normalizeRegionSearchTerm(area.dong);

    return (
      normalizedLabel.includes(normalizedQuery) ||
      normalizedDong.includes(normalizedQuery)
    );
  });
}

/**
 * districtId 로 기존 선택값을 다시 찾거나, 검색/칩 선택 결과를 단일 값으로 정규화한다.
 * 이후 단계는 이 값만 들고 있어도 API 요청(districtId)과 구 표시(category)를 함께 복원할 수 있다.
 */
export function toSituationRegionValue(
  match: RegionSearchMatch,
): SituationRegionValue {
  return {
    districtId: match.area.id,
    label: match.area.label,
    dong: match.area.dong,
    categoryId: match.groupId,
    categoryLabel: match.groupLabel,
  };
}

/**
 * 저장된 districtId 를 다시 그룹/지역 엔트리로 역조회한다.
 * UI가 새로 열려도 어떤 구가 활성화되어야 하는지 결정할 때 사용한다.
 */
export function findRegionMatchByDistrictId(
  groups: readonly RegionGroup[],
  districtId: string,
): RegionSearchMatch | undefined {
  return buildRegionSearchMatches(groups).find(({ area }) =>
    area.districtIds.includes(districtId),
  );
}

/**
 * URL에 저장된 표시명/행정동 정보를 기준으로 현재 지역 목록에서 같은 엔트리를 다시 찾는다.
 * 백엔드 지역 마스터가 바뀌어 districtId가 오래됐더라도 같은 동네를 현재 id로 복구할 때 사용한다.
 */
export function findRegionMatchByLabel(
  groups: readonly RegionGroup[],
  regionLabel: string,
  dong?: string,
  categoryLabel?: string,
): RegionSearchMatch | undefined {
  return buildRegionSearchMatches(groups).find((match) => {
    if (match.area.label !== regionLabel) {
      return false;
    }
    if (dong && match.area.dong !== dong) {
      return false;
    }
    if (categoryLabel && match.groupLabel !== categoryLabel) {
      return false;
    }
    return true;
  });
}

/**
 * 저장된 지역값을 현재 backend 지역 목록 기준 canonical districtId로 정규화한다.
 * 오래된 districtId여도 label/dong/category 정보로 현재 엔트리를 복원할 수 있으면 그 값을 사용한다.
 */
export function normalizeSituationRegionValue(
  groups: readonly RegionGroup[],
  region: SituationRegionValue,
): SituationRegionValue | undefined {
  const byDistrictId = findRegionMatchByDistrictId(groups, region.districtId);
  if (byDistrictId) {
    return toSituationRegionValue(byDistrictId);
  }

  const byLabel = findRegionMatchByLabel(
    groups,
    region.label,
    region.dong,
    region.categoryLabel,
  );

  return byLabel ? toSituationRegionValue(byLabel) : undefined;
}

/**
 * 현재 보여주는 그룹 안에서 선택한 area id 를 실제 지역 값으로 변환한다.
 * 칩 선택과 검색 선택이 같은 정규화 경로를 타도록 맞춘다.
 */
export function findRegionValueByAreaId(
  groups: readonly RegionGroup[],
  areaId: string,
): SituationRegionValue | undefined {
  const match = findRegionMatchByDistrictId(groups, areaId);
  return match ? toSituationRegionValue(match) : undefined;
}

function findRegionMatchByDistrictIds(
  groups: readonly RegionGroup[],
  districtIds: readonly string[],
): RegionSearchMatch | undefined {
  for (const districtId of districtIds) {
    const match = findRegionMatchByDistrictId(groups, districtId);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function findRegionMatchForPopularKeyword(
  groups: readonly RegionGroup[],
  keyword: PopularRegionKeyword,
): RegionSearchMatch | undefined {
  return (
    findRegionMatchByDistrictIds(groups, keyword.districtIds) ??
    findRegionMatchByLabel(
      groups,
      keyword.label,
      keyword.dong,
      keyword.regionLabel,
    )
  );
}

export function getRegionGroupAreas(
  groups: readonly RegionGroup[],
  groupId?: string,
): readonly RegionArea[] {
  return groups.find((group) => group.id === groupId)?.areas ?? [];
}

/**
 * 선택한 구(그룹) 안에서 검색어로 세부 지역을 좁힌다(`name` 또는 `dong` 매칭).
 * 검색 위주 플로우라 빈 검색어는 결과를 비워, 사용자가 검색해야만 목록이 노출되게 한다.
 */
export function filterRegionAreas(
  areas: readonly RegionArea[],
  query: string,
): readonly RegionArea[] {
  const normalizedQuery = normalizeRegionSearchTerm(query);
  if (!normalizedQuery) {
    return [];
  }

  return areas.filter(
    (area) =>
      normalizeRegionSearchTerm(area.label).includes(normalizedQuery) ||
      normalizeRegionSearchTerm(area.dong).includes(normalizedQuery),
  );
}

/**
 * 인기 검색어 payload 를 칩 렌더용 view-model 로 정규화한다.
 * 응답의 districtIds 또는 label/dong 을 기준으로 현재 그룹 메타를 다시 연결한다.
 */
export function buildPopularRegionKeywords(
  groups: readonly RegionGroup[],
  keywords: readonly PopularRegionKeyword[],
): PopularRegionKeyword[] {
  return keywords.map((keyword) => {
    const match = findRegionMatchForPopularKeyword(groups, keyword);

    return {
      ...keyword,
      id: match?.area.id ?? keyword.id,
      districtIds: match?.area.districtIds ?? keyword.districtIds,
      regionLabel: match?.groupLabel ?? keyword.regionLabel,
    };
  });
}

/**
 * 인기 검색어를 즉시 선택 가능한 canonical 지역 값으로 변환한다.
 * 칩 클릭 시 CTA를 바로 활성화할 수 있도록 districtId/category 정보를 함께 복원한다.
 */
export function resolvePopularRegionKeyword(
  groups: readonly RegionGroup[],
  keyword: PopularRegionKeyword,
): SituationRegionValue | undefined {
  const match = findRegionMatchForPopularKeyword(groups, keyword);
  return match ? toSituationRegionValue(match) : undefined;
}
