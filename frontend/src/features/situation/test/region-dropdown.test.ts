import { describe, expect, it } from "vitest";

import {
  getRegionFilterQuery,
  getRegionResultsState,
  isEditingRegionQuery,
  listRegionAreas,
  splitRegionHighlight,
} from "../model/region-dropdown";
import type { RegionArea, SituationRegionValue } from "../model/types";

const areas: RegionArea[] = [
  { id: "a1", label: "서촌", dong: "청운효자동", districtIds: ["a1"] },
  { id: "a2", label: "삼청동", dong: "삼청동", districtIds: ["a2"] },
  { id: "a3", label: "혜화동", dong: "혜화동", districtIds: ["a3"] },
];

const seochon: SituationRegionValue = {
  districtId: "a1",
  label: "서촌",
  dong: "청운효자동",
  categoryId: "종로구",
  categoryLabel: "종로구",
};

/** issue #208 (QA #2): 동네 검색형 드롭다운. */
describe("getRegionFilterQuery", () => {
  it("칸 글자가 고른 동 이름 그대로면 필터하지 않는다(다시 열면 전체 목록)", () => {
    expect(getRegionFilterQuery("서촌", seochon)).toBe("");
  });

  it("고른 동이 없거나 글자가 다르면 그대로 검색어다", () => {
    expect(getRegionFilterQuery("서촌", undefined)).toBe("서촌");
    expect(getRegionFilterQuery("삼청", seochon)).toBe("삼청");
  });
});

describe("listRegionAreas", () => {
  it("빈 검색어면 그 구의 동네 전체를 돌려준다", () => {
    expect(listRegionAreas(areas, "")).toEqual(areas);
    expect(listRegionAreas(areas, "   ")).toEqual(areas);
  });

  it("검색어가 있으면 이름 · 행정동으로 좁힌다", () => {
    expect(listRegionAreas(areas, "삼청").map((area) => area.id)).toEqual(["a2"]);
    expect(listRegionAreas(areas, "청운").map((area) => area.id)).toEqual(["a1"]);
  });
});

describe("getRegionResultsState", () => {
  it("구를 골랐고 검색어가 없으면 구 동네 목록", () => {
    expect(getRegionResultsState({ scoped: true, filterQuery: "", resultCount: 3 })).toBe("list");
  });

  it("구를 고르지 않았고 검색어도 없으면 안내", () => {
    expect(getRegionResultsState({ scoped: false, filterQuery: "", resultCount: 0 })).toBe("hint");
  });

  it("검색어가 있으면 결과 유무로 검색 결과 / 결과 없음", () => {
    expect(getRegionResultsState({ scoped: false, filterQuery: "서", resultCount: 2 })).toBe("search");
    expect(getRegionResultsState({ scoped: true, filterQuery: "없는동", resultCount: 0 })).toBe("empty");
  });
});

describe("splitRegionHighlight", () => {
  it("검색어와 일치하는 부분만 강조 조각으로 나눈다", () => {
    expect(splitRegionHighlight("성수1가1동", "수1")).toEqual([
      { text: "성", match: false },
      { text: "수1", match: true },
      { text: "가1동", match: false },
    ]);
  });

  it("검색어가 없거나 이름에 그대로 없으면 강조하지 않는다", () => {
    expect(splitRegionHighlight("서촌", "")).toEqual([{ text: "서촌", match: false }]);
    expect(splitRegionHighlight("서촌", "청운")).toEqual([{ text: "서촌", match: false }]);
  });
});

describe("isEditingRegionQuery", () => {
  it("칸이 비었거나 고른 동 이름 그대로면 고치는 중이 아니다", () => {
    expect(isEditingRegionQuery("", "서촌")).toBe(false);
    expect(isEditingRegionQuery("서촌", "서촌")).toBe(false);
  });

  it("고른 동이 없는데 글자가 있거나, 이름과 다르면 고치는 중이다", () => {
    expect(isEditingRegionQuery("성", undefined)).toBe(true);
    expect(isEditingRegionQuery("서", "서촌")).toBe(true);
  });
});
