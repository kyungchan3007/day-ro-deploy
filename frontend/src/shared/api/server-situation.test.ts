import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSituationPopularKeywords,
  getSituationRegions,
  retrySituation,
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
          dong: "역삼1동",
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
        address: "서울 종로구 사직로 161",
        rating: 4.6,
        userRatingCount: 1234,
        businessHours: null,
        latitude: null,
        longitude: null,
      },
    ],
    requestId: "request-1",
    remainingRetries: 5,
  },
};

const popularKeywordsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      name: "합정",
      dong: "합정동",
      districtIds: ["3120101"],
    },
  ],
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

  it("shares force-cache popular keyword reads across server entrypoints by default", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(popularKeywordsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const response = await getSituationPopularKeywords();

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/regions/popular-keywords", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
    expect(response).toEqual(popularKeywordsPayload);
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

  it("retries situation recommendations through the same shared server entrypoint", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(situationsPayload), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    const response = await retrySituation("request-1");

    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/situations/request-1/retry", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(response).toEqual(situationsPayload);
  });
  it("sends the access token as a Bearer header only when logged in (issue #135)", async () => {
    vi.mocked(fetch).mockImplementation(
      async () =>
        new Response(JSON.stringify(situationsPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    const request = {
      startTime: "18:00:00",
      endTime: "21:00:00",
      districtId: "3120006",
      purpose: "CASUAL_DATE",
    } as const;
    const headersOf = (call: number) =>
      (vi.mocked(fetch).mock.calls[call][1]?.headers ?? {}) as Record<string, string>;

    await submitSituation(request, { accessToken: "member-token" });
    await retrySituation("request-1", { accessToken: "member-token" });
    await submitSituation(request);
    await retrySituation("request-1", { accessToken: null });

    expect(headersOf(0).Authorization).toBe("Bearer member-token");
    expect(headersOf(0)["Content-Type"]).toBe("application/json");
    expect(headersOf(1).Authorization).toBe("Bearer member-token");
    expect(headersOf(2)).not.toHaveProperty("Authorization");
    expect(headersOf(3)).not.toHaveProperty("Authorization");
  });
  it.each(["..", "../auth/withdraw", "a/b", "id.with.dot", ""])(
    "rejects an unsafe retry requestId %s without calling the backend (issue #139)",
    async (requestId) => {
      await expect(retrySituation(requestId)).rejects.toThrow("잘못된 추천 재요청입니다.");
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
