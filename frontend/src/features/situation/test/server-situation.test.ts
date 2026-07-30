import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as regionsRoute } from "../../../app/api/regions/route";
import { POST as situationsRoute } from "../../../app/api/situations/route";

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

describe("Situation BFF routes", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("regions route proxies the backend regions contract", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(regionsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const response = await regionsRoute();
    const body = await response.json();

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/regions", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
    expect(response.status).toBe(200);
    expect(body).toEqual(regionsPayload);
  });

  it("situations route validates and proxies the backend recommendation request", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(situationsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/situations", {
      method: "POST",
      body: JSON.stringify({
        startTime: "18:00:00",
        endTime: "21:00:00",
        districtId: "3120006",
        purpose: "CASUAL_DATE",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await situationsRoute(request);
    const body = await response.json();

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
    expect(response.status).toBe(200);
    expect(body).toEqual(situationsPayload);
  });

  it("situations route rejects invalid input before hitting the backend", async () => {
    const request = new NextRequest("http://localhost:3000/api/situations", {
      method: "POST",
      body: JSON.stringify({
        startTime: "18:00",
        endTime: "21:00:00",
        districtId: "",
        purpose: "DATE",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await situationsRoute(request);
    const body = await response.json();

    expect(fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      message: "잘못된 상황 입력 요청입니다.",
      data: null,
    });
  });
});
