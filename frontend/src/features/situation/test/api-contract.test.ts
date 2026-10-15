import { describe, expect, it } from "vitest";
import {
  courseCandidateResponseSchema,
  regionPopularKeywordsResponseSchema,
  regionsResponseSchema,
  situationOpenApi,
  situationInputRequestSchema,
} from "../../../shared/api/openapi/dayro.openapi";

describe("Situation API contracts", () => {
  it("keeps situation endpoint contracts in the shared openapi module", () => {
    expect(situationOpenApi.paths.regions).toBe("/api/regions");
    expect(situationOpenApi.paths.popularKeywords).toBe(
      "/api/regions/popular-keywords",
    );
    expect(situationOpenApi.paths.submit).toBe("/api/situations");
    expect(situationOpenApi.paths.retry).toBe("/api/situations/:requestId/retry");
  });

  it("parses the course recommendation request", () => {
    expect(
      situationInputRequestSchema.parse({
        startTime: "18:30:00",
        endTime: "21:30:00",
        districtId: "11710",
        purpose: "CASUAL_DATE",
      }),
    ).toEqual({
      startTime: "18:30:00",
      endTime: "21:30:00",
      districtId: "11710",
      purpose: "CASUAL_DATE",
    });
  });

  it("parses the regions response wrapper", () => {
    expect(
      regionsResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: [
          {
            category: "강남구",
            regions: [
              {
                name: "강남",
                dong: "역삼1동",
                districtIds: ["3120210", "3120189"],
              },
            ],
          },
        ],
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: [
        {
          category: "강남구",
          regions: [
            {
              name: "강남",
              dong: "역삼1동",
              districtIds: ["3120210", "3120189"],
            },
          ],
        },
      ],
    });
  });

  it("parses the course recommendation response wrapper", () => {
    expect(
      courseCandidateResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: {
          places: [
            {
              placeId: "place-1",
              name: "성수 브런치",
              category: "CAFE",
              district: "성수",
              address: "서울 성동구 성수이로 10",
              rating: 4.7,
              userRatingCount: 128,
              businessHours: "매일 10:00-22:00",
              latitude: 37.5441,
              longitude: 127.0557,
            },
          ],
          requestId: "request-1",
          remainingRetries: 5,
        },
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: {
        places: [
          {
            placeId: "place-1",
            name: "성수 브런치",
            category: "CAFE",
            district: "성수",
            address: "서울 성동구 성수이로 10",
            rating: 4.7,
            userRatingCount: 128,
            businessHours: "매일 10:00-22:00",
            latitude: 37.5441,
            longitude: 127.0557,
          },
        ],
        requestId: "request-1",
        remainingRetries: 5,
      },
    });
  });

  it("parses the popular region keywords response wrapper", () => {
    expect(
      regionPopularKeywordsResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: [
          {
            name: "강남",
            dong: "역삼1동",
            districtIds: ["3120210", "3120189"],
          },
        ],
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: [
        {
          name: "강남",
          dong: "역삼1동",
          districtIds: ["3120210", "3120189"],
        },
      ],
    });
  });
});
