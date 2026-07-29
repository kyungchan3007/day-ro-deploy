import { describe, expect, it } from "vitest";
import { buildRegionGroupsFromResponse } from "../model/region-groups";
import { buildSituationRequest } from "../model/request";

describe("Situation request helpers", () => {
  it("builds region groups from backend category data", () => {
    expect(
      buildRegionGroupsFromResponse([
      {
        category: "마포구",
        regions: [
          { name: "연남동", districtIds: ["3120104"] },
          { name: "합정", districtIds: ["3120101"] },
        ],
      },
      {
        category: "강남구",
        regions: [
          { name: "강남", districtIds: ["3120210", "3120189"] },
        ],
      },
    ]),
    ).toEqual([
      {
        id: "마포구",
        label: "마포구",
        areas: [
          { id: "3120104", label: "연남동" },
          { id: "3120101", label: "합정" },
        ],
      },
      {
        id: "강남구",
        label: "강남구",
        areas: [{ id: "3120210", label: "강남" }],
      },
    ]);
  });

  it("builds the backend request payload from situation answers", () => {
    expect(
      buildSituationRequest({
        time: {
          start: { meridiem: "오후", hour: 6, minute: 30 },
          end: { meridiem: "오후", hour: 9, minute: 0 },
        },
        region: {
          districtId: "3120006",
          label: "종로",
        },
        purpose: "date",
      }),
    ).toEqual({
      startTime: "18:30:00",
      endTime: "21:00:00",
      districtId: "3120006",
      purpose: "CASUAL_DATE",
    });
  });
});
