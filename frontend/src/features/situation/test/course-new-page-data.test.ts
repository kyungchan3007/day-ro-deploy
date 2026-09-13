import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCourseNewPageData } from "../server/get-course-new-page-data";
import { buildCourseRouteUrl } from "../model/url-state";

const regionsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      category: "강남권",
      regions: [
        {
          name: "역삼동",
          dong: "역삼1동",
          districtIds: ["3120210", "3120189"],
        },
      ],
    },
  ],
};

const popularKeywordsPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      name: "역삼동",
      dong: "역삼1동",
      districtIds: ["3120210", "3120189"],
    },
    {
      name: "성수",
      dong: "성수1가1동",
      districtIds: ["3120052", "3120051"],
    },
  ],
};

const situationsPayload = {
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
};

function toSearchParamsObject(url: string) {
  return Object.fromEntries(new URL(url, "http://localhost:3000").searchParams.entries());
}

describe("getCourseNewPageData", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the first incomplete step and server region groups for partial input", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "region",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
          },
        }),
      ),
    );

    expect(pageData.step).toBe("region");
    expect(pageData.regionGroups).toEqual([
      {
        id: "강남권",
        label: "강남권",
        areas: [
          {
            id: "3120210",
            label: "역삼동",
            dong: "역삼1동",
            districtIds: ["3120210", "3120189"],
          },
        ],
      },
    ]);
    expect(pageData.popularRegionKeywords).toEqual([
      {
        id: "3120210",
        label: "역삼동",
        dong: "역삼1동",
        districtIds: ["3120210", "3120189"],
      },
      {
        id: "3120052",
        label: "성수",
        dong: "성수1가1동",
        districtIds: ["3120052", "3120051"],
      },
    ]);
    expect(pageData.candidates).toEqual([]);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL("/api/regions", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL("/api/regions/popular-keywords", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
  });

  it("prepares result candidates on the server for the result step", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(situationsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "result",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120210",
              label: "역삼동",
              dong: "역삼1동",
              categoryId: "gangnam",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
        }),
      ),
    );

    expect(pageData.step).toBe("result");
    expect(pageData.candidates).toEqual(situationsPayload.data.places);
    expect(pageData.candidateRequestId).toBe("request-1");
    expect(pageData.remainingRetries).toBe(5);
    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/situations", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("reuses result candidate snapshots without refetching situations", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "result",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120210",
              label: "역삼동",
              dong: "역삼1동",
              categoryId: "gangnam",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
          requestId: "request-1",
          candidatePlaces: situationsPayload.data.places,
        }),
      ),
    );

    expect(pageData.step).toBe("result");
    expect(pageData.candidates).toEqual(situationsPayload.data.places);
    expect(pageData.candidateRequestId).toBe("request-1");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the explicit loading step without fetching candidates yet", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "loading",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120210",
              label: "역삼동",
              dong: "역삼1동",
              categoryId: "gangnam",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
        }),
      ),
    );

    expect(pageData.step).toBe("loading");
    expect(pageData.candidates).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL("/api/regions", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL("/api/regions/popular-keywords", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
  });

  it("keeps loading step request metadata for reroll without fetching candidates yet", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "loading",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120210",
              label: "역삼동",
              dong: "역삼1동",
              categoryId: "gangnam",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
          requestId: "request-1",
          retryKey: "reroll-1",
        }),
      ),
    );

    expect(pageData.step).toBe("loading");
    expect(pageData.candidateRequestId).toBe("request-1");
    expect(pageData.candidates).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("restores selected places for the course step without client storage", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(situationsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "course",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120210",
              label: "역삼동",
              dong: "역삼1동",
              categoryId: "gangnam",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
          selectedPlaceIds: ["place-1"],
        }),
      ),
    );

    expect(pageData.step).toBe("course");
    expect(pageData.selectedPlaces).toEqual(situationsPayload.data.places);
    expect(fetch).toHaveBeenCalledWith(
      new URL("/api/situations", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("restores selected place snapshots for the course step without refetching candidates", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const selectedPlace = situationsPayload.data.places[0];

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "course",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120210",
              label: "역삼동",
              dong: "역삼1동",
              categoryId: "gangnam",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
          requestId: "request-1",
          selectedPlaceIds: [selectedPlace.placeId],
          selectedPlaces: [selectedPlace],
        }),
      ),
    );

    expect(pageData.step).toBe("course");
    expect(pageData.selectedPlaces).toEqual([selectedPlace]);
    expect(pageData.candidateRequestId).toBe("request-1");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("reuses the current backend district id when the persisted value matches a secondary id", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(situationsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "result",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "3120189",
              label: "역삼동",
              dong: "역삼1동",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
        }),
      ),
    );

    expect(pageData.answers.region).toEqual({
      districtId: "3120210",
      label: "역삼동",
      dong: "역삼1동",
      categoryId: "강남권",
      categoryLabel: "강남권",
    });
    expect(fetch).toHaveBeenLastCalledWith(
      new URL("/api/situations", "http://localhost:8080"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          startTime: "18:00:00",
          endTime: "21:00:00",
          districtId: "3120210",
          purpose: "CASUAL_DATE",
        }),
      }),
    );
  });

  it("falls back to the region step when the persisted district id cannot be matched", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(regionsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(popularKeywordsPayload), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const pageData = await getCourseNewPageData(
      toSearchParamsObject(
        buildCourseRouteUrl({
          step: "result",
          answers: {
            time: {
              start: { meridiem: "오후", hour: 6, minute: 0 },
              end: { meridiem: "오후", hour: 9, minute: 0 },
            },
            region: {
              districtId: "legacy-11680",
              label: "없는 동네",
              dong: "없는 행정동",
              categoryLabel: "강남권",
            },
            purpose: "date",
          },
        }),
      ),
    );

    expect(pageData.step).toBe("region");
    expect(pageData.answers.region).toBeUndefined();
    expect(pageData.candidates).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL("/api/regions", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL("/api/regions/popular-keywords", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        cache: "force-cache",
      }),
    );
  });
});
