import { describe, expect, it } from "vitest";

import {
  courseOpenApi,
  courseDetailResponseSchema,
  courseDeleteResponseSchema,
  courseSummaryListResponseSchema,
  courseSaveRequestSchema,
  courseSaveResponseSchema,
} from "../../../shared/api/openapi/dayro.openapi";

describe("Course save API contracts", () => {
  it("keeps the course save endpoint in the shared openapi module", () => {
    expect(courseOpenApi.paths.save).toBe("/api/courses");
    expect(courseOpenApi.paths.list).toBe("/api/courses");
    expect(courseOpenApi.paths.detail).toBe("/api/courses/:id");
    expect(courseOpenApi.paths.update).toBe("/api/courses/:id");
    expect(courseOpenApi.paths.delete).toBe("/api/courses/:id");
  });

  it("parses the course delete void response wrapper", () => {
    expect(
      courseDeleteResponseSchema.parse({
        success: true,
        message: "코스가 삭제되었습니다.",
        data: null,
      }),
    ).toEqual({
      success: true,
      message: "코스가 삭제되었습니다.",
      data: null,
    });
  });

  it("parses the course save request", () => {
    expect(
      courseSaveRequestSchema.parse({
        title: "역삼 데이트 코스",
        description: "퇴근 후 가볍게 걷는 코스",
        districtId: "3120210",
        purpose: "CASUAL_DATE",
        startTime: "18:00:00",
        endTime: "21:30:00",
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
      title: "역삼 데이트 코스",
      description: "퇴근 후 가볍게 걷는 코스",
      districtId: "3120210",
      purpose: "CASUAL_DATE",
      startTime: "18:00:00",
      endTime: "21:30:00",
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
    });
  });

  it("parses the course save response wrapper", () => {
    expect(
      courseSaveResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: {
          id: "11111111-1111-4111-8111-111111111111",
          title: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
          regionName: "역삼동",
          regionCategory: "강남구",
          purpose: "CASUAL_DATE",
          startTime: "18:00:00",
          endTime: "21:30:00",
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
          createdAt: "2026-08-07T14:30:00",
        },
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "역삼 데이트 코스",
        description: "퇴근 후 가볍게 걷는 코스",
        regionName: "역삼동",
        regionCategory: "강남구",
        purpose: "CASUAL_DATE",
        startTime: "18:00:00",
        endTime: "21:30:00",
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
        createdAt: "2026-08-07T14:30:00",
      },
    });
  });

  it("parses the course summary list response wrapper", () => {
    expect(
      courseSummaryListResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            title: "역삼 데이트 코스",
            description: "퇴근 후 가볍게 걷는 코스",
            regionName: "역삼동",
            purpose: "CASUAL_DATE",
            createdAt: "2026-08-07T14:30:00",
            placeCount: 4,
            thumbnailUrl: "/api/places/photo?name=place-1",
          },
        ],
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          title: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
          regionName: "역삼동",
          purpose: "CASUAL_DATE",
          createdAt: "2026-08-07T14:30:00",
          placeCount: 4,
          thumbnailUrl: "/api/places/photo?name=place-1",
        },
      ],
    });
  });

  it("parses the course detail response wrapper", () => {
    expect(
      courseDetailResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: {
          id: "11111111-1111-4111-8111-111111111111",
          title: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
          regionName: "역삼동",
          regionCategory: "강남구",
          purpose: "CASUAL_DATE",
          startTime: "18:00:00",
          endTime: "21:30:00",
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
          createdAt: "2026-08-07T14:30:00",
        },
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: {
        id: "11111111-1111-4111-8111-111111111111",
        title: "역삼 데이트 코스",
        description: "퇴근 후 가볍게 걷는 코스",
        regionName: "역삼동",
        regionCategory: "강남구",
        purpose: "CASUAL_DATE",
        startTime: "18:00:00",
        endTime: "21:30:00",
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
        createdAt: "2026-08-07T14:30:00",
      },
    });
  });
});
