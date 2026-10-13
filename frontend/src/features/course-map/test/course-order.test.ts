import { describe, expect, it } from "vitest";

import {
  isSameOrder,
  isSamePlaceSet,
  reorderPlaces,
} from "../model/course-order";
import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";

/** 테스트용 최소 장소(placeId 만 의미 있음). */
function place(id: string): PlaceCandidate {
  return {
    placeId: id,
    name: id,
    category: "카페",
    district: "종로구",
    address: "주소",
    rating: null,
    userRatingCount: null,
    businessHours: null,
    latitude: 37.5,
    longitude: 127,
  };
}

const base = [place("a"), place("b"), place("c"), place("d")];

describe("course order model", () => {
  it("moves an item from one index to another (immutable)", () => {
    const next = reorderPlaces(base, 0, 2);
    expect(next.map((p) => p.placeId)).toEqual(["b", "c", "a", "d"]);
    // 원본 불변
    expect(base.map((p) => p.placeId)).toEqual(["a", "b", "c", "d"]);
  });

  it("returns an unchanged copy for out-of-range or no-op moves", () => {
    expect(reorderPlaces(base, 1, 1).map((p) => p.placeId)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(reorderPlaces(base, -1, 2).map((p) => p.placeId)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("detects order changes but treats the same set (reordered) as the same course", () => {
    const reordered = reorderPlaces(base, 0, 3);

    expect(isSameOrder(base, reordered)).toBe(false);
    expect(isSameOrder(base, [...base])).toBe(true);
    // 순서만 다르고 집합은 같음 → 같은 코스로 판별
    expect(isSamePlaceSet(base, reordered)).toBe(true);
    // 다른 장소 집합 → 다른 코스
    expect(isSamePlaceSet(base, [place("a"), place("x")])).toBe(false);
  });
});
