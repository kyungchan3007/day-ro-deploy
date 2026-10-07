import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getCourseNewPageData } from "../server/get-course-new-page-data";

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
      name: "성수",
      dong: "성수1가1동",
      districtIds: ["3120052", "3120051"],
    },
  ],
};

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function mockRegionFetches() {
  vi.mocked(fetch)
    .mockResolvedValueOnce(jsonResponse(regionsPayload))
    .mockResolvedValueOnce(jsonResponse(popularKeywordsPayload));
}

function calledPaths(): string[] {
  return vi.mocked(fetch).mock.calls.map(([input]) => new URL(String(input)).pathname);
}

describe("getCourseNewPageData (issue #129 — step·rev only)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("prepares region reference data for the time and region steps", async () => {
    mockRegionFetches();

    const result = await getCourseNewPageData({ step: "region", rev: "abcd1234" });

    expect(result).toEqual({
      kind: "render",
      data: {
        step: "region",
        rev: "abcd1234",
        regionGroups: [
          expect.objectContaining({ label: "강남권" }),
        ],
        popularRegionKeywords: [
          {
            id: "3120052",
            label: "성수",
            dong: "성수1가1동",
            districtIds: ["3120052", "3120051"],
          },
        ],
      },
    });
    expect(calledPaths()).toEqual(["/api/regions", "/api/regions/popular-keywords"]);
  });

  it("treats a bare entry as the time step without a rev", async () => {
    mockRegionFetches();

    const result = await getCourseNewPageData({});

    expect(result).toMatchObject({ kind: "render", data: { step: "time", rev: undefined } });
  });

  it.each(["purpose", "loading", "result", "course"])(
    "never generates a course or fetches regions while rendering the %s step",
    async (step) => {
      const result = await getCourseNewPageData({ step, rev: "k3x9ab2m" });

      expect(result).toEqual({
        kind: "render",
        data: { step, rev: "k3x9ab2m", regionGroups: [], popularRegionKeywords: [] },
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("redirects legacy state queries without generating, keeping only attribution keys", async () => {
    const result = await getCourseNewPageData({
      step: "result",
      requestId: "request-1",
      candidatePlaces: '[{"placeId":"p","name":"cafe"}]',
      districtId: "11680",
      utm_source: "instagram",
      fbclid: "fb-1",
    });

    expect(result).toEqual({
      kind: "redirect",
      url: "/course/new/?step=time&utm_source=instagram&fbclid=fb-1",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [{ step: "result", rev: "SHORT" }],
    [{ step: "unknown-step" }],
    [{ step: ["result", "course"] }],
  ])("redirects malformed course routes %j", async (searchParams) => {
    const result = await getCourseNewPageData(searchParams);

    expect(result.kind).toBe("redirect");
    expect(fetch).not.toHaveBeenCalled();
  });
});
