import { describe, expect, it } from "vitest";

import { buildSavedCourseCardViewModel } from "../model/saved-course";

describe("buildSavedCourseCardViewModel", () => {
  it("maps backend course summary to the saved card contract", () => {
    expect(
      buildSavedCourseCardViewModel({
        id: "11111111-1111-4111-8111-111111111111",
        title: "역삼 데이트 코스",
        description: "퇴근 후 가볍게 걷는 코스",
        regionName: "역삼동",
        purpose: "CASUAL_DATE",
        createdAt: "2026-08-07T14:30:00",
        placeCount: 4,
        thumbnailUrl: "/api/places/photo?name=place-1",
      }),
    ).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      name: "역삼 데이트 코스",
      desc: "퇴근 후 가볍게 걷는 코스",
      meta: "4곳 · 역삼동",
      date: "2026.08.07 저장",
    });
  });
});
