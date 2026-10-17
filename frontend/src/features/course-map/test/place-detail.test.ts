import { describe, expect, it } from "vitest";

import { buildPlaceDetails } from "../model/place-detail";

/** issue #219 (QA #8): 장소 드롭다운 상세 줄. */
describe("buildPlaceDetails", () => {
  it("영업시간 → 주소 → 평점 순서", () => {
    expect(buildPlaceDetails({ businessHours: "매일 09:00-18:00", address: "서울 종로구 사직로 161", rating: 4.8 })).toEqual([
      { label: "영업시간", value: "매일 09:00-18:00" },
      { label: "주소", value: "서울 종로구 사직로 161" },
      { label: "평점", value: "4.8" },
    ]);
  });

  it("영업시간이 없으면 숨기지 않고 '영업시간 정보 없음'", () => {
    expect(buildPlaceDetails({ businessHours: null, address: null, rating: null })).toEqual([
      { label: "영업시간", value: "영업시간 정보 없음", empty: true },
    ]);
    expect(buildPlaceDetails({ businessHours: "  ", address: null, rating: null })[0].empty).toBe(true);
  });

  it("'24시간 영업' 은 백엔드 문자열 그대로", () => {
    expect(buildPlaceDetails({ businessHours: "24시간 영업", address: null, rating: null })[0]).toEqual({
      label: "영업시간",
      value: "24시간 영업",
    });
  });
});
