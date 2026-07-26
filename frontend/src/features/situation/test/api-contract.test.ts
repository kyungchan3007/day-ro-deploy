import { describe, expect, it } from "vitest";
import {
  courseCandidateResponseSchema,
  regionsResponseSchema,
  situationOpenApi,
  situationInputRequestSchema,
} from "../../../shared/api/openapi/dayro.openapi";

describe("Situation API contracts", () => {
  it("keeps situation endpoint contracts in the shared openapi module", () => {
    expect(situationOpenApi.paths.regions).toBe("/api/regions");
    expect(situationOpenApi.paths.submit).toBe("/api/situations");
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
            category: "강남권",
            regions: [
              {
                name: "강남",
                districtIds: ["11680", "11681"],
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
          category: "강남권",
          regions: [
            {
              name: "강남",
              districtIds: ["11680", "11681"],
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
            },
          ],
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
          },
        ],
      },
    });
  });
});
