import { describe, expect, it } from "vitest";

import {
  buildSavedCourseDetailViewModel,
  buildSavedCourseUpdateRequest,
} from "../model/saved-course-detail";

describe("buildSavedCourseDetailViewModel", () => {
  it("maps backend course detail to the shared course preview contract", () => {
    expect(
      buildSavedCourseDetailViewModel({
        id: "11111111-1111-4111-8111-111111111111",
        title: "역삼 데이트 코스",
        description: "퇴근 후 가볍게 걷는 코스",
        regionName: "역삼동",
        regionCategory: "강남구",
        purpose: "CASUAL_DATE",
        startTime: "18:00:00",
        endTime: "21:30:00",
        createdAt: "2026-08-07T14:30:00",
        places: [
          {
            placeId: "place-1",
            name: "장소-1",
            category: "CAFE",
            address: "서울 성동구 성수이로 10",
            rating: 4.7,
            userRatingCount: 128,
            businessHours: "매일 10:00-22:00",
            latitude: 37.5441,
            longitude: 127.0557,
            photoUrl: "/api/places/photo?name=place-1",
          },
        ],
      }),
    ).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      title: "역삼 데이트 코스",
      description: "퇴근 후 가볍게 걷는 코스",
      places: [
        {
          placeId: "place-1",
          name: "장소-1",
          category: "CAFE",
          district: undefined,
          address: "서울 성동구 성수이로 10",
          rating: 4.7,
          userRatingCount: 128,
          businessHours: "매일 10:00-22:00",
          latitude: 37.5441,
          longitude: 127.0557,
          photoUrl: "/api/places/photo?name=place-1",
        },
      ],
    });
  });

  it("serializes reordered saved course places to the update contract", () => {
    expect(
      buildSavedCourseUpdateRequest(
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
          places: [
            {
              placeId: "place-1",
              name: "장소-1",
            },
            {
              placeId: "place-2",
              name: "장소-2",
            },
          ],
        },
        [
          {
            placeId: "place-2",
            name: "장소-2",
          },
          {
            placeId: "place-1",
            name: "장소-1",
          },
        ],
      ),
    ).toEqual({
      title: "역삼 데이트 코스",
      description: "퇴근 후 가볍게 걷는 코스",
      placeIds: ["place-2", "place-1"],
    });
  });
});
