import { describe, expect, it } from "vitest";

import type { PlaceCandidate } from "../api/openapi/dayro.openapi";
import { toCoursePreviewPoints } from "./course-preview";

/** 삭제한 course-map `toCoursePoints` 테스트를 실제로 쓰는 공용 변환으로 옮김(issue #229). */
function place(id: string, latitude: number | null, longitude: number | null): PlaceCandidate {
  return {
    placeId: id,
    name: `장소-${id}`,
    category: "카페",
    district: "종로구",
    address: "서울 종로구 어딘가",
    rating: 4.5,
    userRatingCount: 100,
    businessHours: null,
    latitude,
    longitude,
  };
}

describe("toCoursePreviewPoints", () => {
  it("선택 순서대로 좌표 있는 장소를 지도 포인트로 바꾼다", () => {
    expect(toCoursePreviewPoints([place("1", 37.1, 127.1), place("2", 37.2, 127.2)])).toEqual([
      { order: 1, name: "장소-1", latitude: 37.1, longitude: 127.1 },
      { order: 2, name: "장소-2", latitude: 37.2, longitude: 127.2 },
    ]);
  });

  it("좌표가 없는 장소는 빼고 원래 방문 순번은 유지한다", () => {
    expect(
      toCoursePreviewPoints([
        place("1", 37.1, 127.1),
        place("2", null, 127.2),
        place("3", 37.3, null),
        place("4", 37.4, 127.4),
      ]),
    ).toEqual([
      { order: 1, name: "장소-1", latitude: 37.1, longitude: 127.1 },
      { order: 4, name: "장소-4", latitude: 37.4, longitude: 127.4 },
    ]);
  });
});
