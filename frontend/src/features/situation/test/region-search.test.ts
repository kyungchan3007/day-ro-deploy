import { describe, expect, it } from "vitest";

import {
  buildPopularRegionKeywords,
  filterRegionAreas,
  findRegionMatchByDistrictId,
  findRegionMatchByLabel,
  findRegionValueByAreaId,
  normalizeSituationRegionValue,
  resolvePopularRegionKeyword,
  searchRegionMatches,
  toSituationRegionValue,
} from "../model/region-search";
import type { RegionGroup } from "../model/types";

const groups: RegionGroup[] = [
  {
    id: "마포구",
    label: "마포구",
    areas: [
      {
        id: "3120101",
        label: "합정",
        dong: "합정동",
        districtIds: ["3120101"],
      },
      {
        id: "3120104",
        label: "홍대",
        dong: "서교동",
        districtIds: ["3120104"],
      },
    ],
  },
  {
    id: "성동구",
    label: "성동구",
    areas: [
      {
        id: "3120052",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120052", "3120051"],
      },
    ],
  },
];

describe("region search model", () => {
  it("matches curated place names and keeps their category for auto-selection", () => {
    const [match] = searchRegionMatches(groups, "홍대");

    expect(match).toEqual({
      groupId: "마포구",
      groupLabel: "마포구",
      area: {
        id: "3120104",
        label: "홍대",
        dong: "서교동",
        districtIds: ["3120104"],
      },
    });
    expect(toSituationRegionValue(match)).toEqual({
      districtId: "3120104",
      label: "홍대",
      dong: "서교동",
      categoryId: "마포구",
      categoryLabel: "마포구",
    });
  });

  it("matches administrative dong names as well as curated labels", () => {
    expect(searchRegionMatches(groups, "합정동")).toEqual([
      {
        groupId: "마포구",
        groupLabel: "마포구",
        area: {
          id: "3120101",
          label: "합정",
          dong: "합정동",
          districtIds: ["3120101"],
        },
      },
    ]);
    expect(searchRegionMatches(groups, "성수1가1동")).toEqual([
      {
        groupId: "성동구",
        groupLabel: "성동구",
        area: {
          id: "3120052",
          label: "성수",
          dong: "성수1가1동",
          districtIds: ["3120052", "3120051"],
        },
      },
    ]);
  });

  it("returns no scoped areas until the user searches (search-first flow)", () => {
    const mapoAreas = groups[0].areas;

    expect(filterRegionAreas(mapoAreas, "")).toEqual([]);
    expect(filterRegionAreas(mapoAreas, "   ")).toEqual([]);
  });

  it("scopes area filtering to the given group by name or dong", () => {
    const mapoAreas = groups[0].areas;

    // 지역명(name) 매칭
    expect(filterRegionAreas(mapoAreas, "홍대")).toEqual([
      {
        id: "3120104",
        label: "홍대",
        dong: "서교동",
        districtIds: ["3120104"],
      },
    ]);
    // 행정동(dong) 매칭
    expect(filterRegionAreas(mapoAreas, "합정동")).toEqual([
      {
        id: "3120101",
        label: "합정",
        dong: "합정동",
        districtIds: ["3120101"],
      },
    ]);
    // 이 구에 없는 동네 → 빈 결과(안내 문구 트리거)
    expect(filterRegionAreas(mapoAreas, "성수")).toEqual([]);
  });

  it("can restore category metadata from a persisted district id", () => {
    expect(findRegionMatchByDistrictId(groups, "3120052")).toEqual({
      groupId: "성동구",
      groupLabel: "성동구",
      area: {
        id: "3120052",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120052", "3120051"],
      },
    });
    expect(findRegionValueByAreaId(groups, "3120052")).toEqual({
      districtId: "3120052",
      label: "성수",
      dong: "성수1가1동",
      categoryId: "성동구",
      categoryLabel: "성동구",
    });
  });

  it("can resolve a secondary backend district id to the canonical area", () => {
    expect(findRegionMatchByDistrictId(groups, "3120051")).toEqual({
      groupId: "성동구",
      groupLabel: "성동구",
      area: {
        id: "3120052",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120052", "3120051"],
      },
    });
  });

  it("can recover a stale district id from persisted label and dong", () => {
    expect(findRegionMatchByLabel(groups, "성수", "성수1가1동", "성동구")).toEqual({
      groupId: "성동구",
      groupLabel: "성동구",
      area: {
        id: "3120052",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120052", "3120051"],
      },
    });
    expect(
      normalizeSituationRegionValue(groups, {
        districtId: "legacy-11680",
        label: "성수",
        dong: "성수1가1동",
        categoryLabel: "성동구",
      }),
    ).toEqual({
      districtId: "3120052",
      label: "성수",
      dong: "성수1가1동",
      categoryId: "성동구",
      categoryLabel: "성동구",
    });
  });

  it("maps popular keywords back to canonical district ids and region labels", () => {
    expect(
      buildPopularRegionKeywords(groups, [
        {
          id: "seed-1",
          label: "성수",
          dong: "성수1가1동",
          districtIds: ["3120051"],
        },
        {
          id: "seed-2",
          label: "합정",
          dong: "합정동",
          districtIds: ["3120101"],
        },
      ]),
    ).toEqual([
      {
        id: "3120052",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120052", "3120051"],
        regionLabel: "성동구",
      },
      {
        id: "3120101",
        label: "합정",
        dong: "합정동",
        districtIds: ["3120101"],
        regionLabel: "마포구",
      },
    ]);
  });

  it("resolves a popular keyword to an immediately selectable region value", () => {
    expect(
      resolvePopularRegionKeyword(groups, {
        id: "seed-1",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120051"],
      }),
    ).toEqual({
      districtId: "3120052",
      label: "성수",
      dong: "성수1가1동",
      categoryId: "성동구",
      categoryLabel: "성동구",
    });
  });
});
