import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSituationRegions,
  submitSituation,
} from "./server-situation";

const regionsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      category: "강남구",
      regions: [
        {
          name: "강남",
          districtIds: ["3120210"],
        },
      ],
    },
  ],
};

const situationsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    places: [
      {
        placeId: "stub-1",
        name: "경복궁",
        category: "고궁",
        district: "종로구",
      },
    ],
  },
};

describe("server situation api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shares force-cache region reads across server entrypoints by default", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(regionsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const response = await getSituationRegions();

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/regions", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
    expect(response).toEqual(regionsPayload);
  });

  it("allows server callers to override the shared cache policy explicitly", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(regionsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await getSituationRegions({
      cache: "no-store",
    });

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/regions", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "no-store",
      }),
    );
  });

  it("submits situation recommendations through the same shared server entrypoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(situationsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const response = await submitSituation({
      startTime: "18:00:00",
      endTime: "21:00:00",
      districtId: "3120006",
      purpose: "CASUAL_DATE",
    });

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/situations", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          startTime: "18:00:00",
          endTime: "21:00:00",
          districtId: "3120006",
          purpose: "CASUAL_DATE",
        }),
      }),
    );
    expect(response).toEqual(situationsPayload);
  });
});
