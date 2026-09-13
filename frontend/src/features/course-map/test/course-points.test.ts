import { describe, expect, it } from "vitest";

import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import { toCoursePoints } from "../model/course-points";

function place(
  id: string,
  latitude: number | null,
  longitude: number | null,
): PlaceCandidate {
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

describe("course-map point mapping", () => {
  it("keeps selection order while mapping valid coordinates", () => {
    const points = toCoursePoints([
      place("1", 37.1, 127.1),
      place("2", 37.2, 127.2),
    ]);

    expect(points).toEqual([
      { order: 1, name: "장소-1", latitude: 37.1, longitude: 127.1 },
      { order: 2, name: "장소-2", latitude: 37.2, longitude: 127.2 },
    ]);
  });

  it("skips places without coordinates", () => {
    const points = toCoursePoints([
      place("1", 37.1, 127.1),
      place("2", null, 127.2),
      place("3", 37.3, null),
      place("4", 37.4, 127.4),
    ]);

    expect(points).toEqual([
      { order: 1, name: "장소-1", latitude: 37.1, longitude: 127.1 },
      { order: 4, name: "장소-4", latitude: 37.4, longitude: 127.4 },
    ]);
  });
});
