import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { CourseCandidateResponse } from "@/shared/api/openapi/dayro.openapi";
const track = vi.hoisted(() => vi.fn());
vi.mock("@/shared/analytics", () => ({
  trackEvent: track
}));
const response = (requestId: string, remainingRetries = 5) => ({
  data: {
    requestId,
    remainingRetries,
    places: []
  }
}) as unknown as CourseCandidateResponse;
beforeEach(() => {
  vi.resetModules();
  track.mockReset();
  const storage = new Map();
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => storage.get(key),
    setItem: (key: string, value: string) => storage.set(key, value)
  });
});
afterEach(() => vi.unstubAllGlobals());
it("deduplicates successful requestIds across reload and only sends categorical data", async () => {
  let { trackGenerationSuccess } = await import("../model/generation-analytics");
  trackGenerationSuccess(response("private-id"), {
    purpose: "date",
    region: {
      districtId: "secret",
      label: "private place"
    },
    transport: {
      local: "walk"
    }
  }, false);
  trackGenerationSuccess(response("private-id"), {}, false);
  vi.resetModules();
  ({
    trackGenerationSuccess
  } = await import("../model/generation-analytics"));
  trackGenerationSuccess(response("private-id"), {}, false);
  expect(track).toHaveBeenCalledTimes(1);
  expect(track).toHaveBeenCalledWith("course_generated", {
    purpose: "date",
    transport: "walk",
    duration: undefined
  });
  trackGenerationSuccess(response("another"), {}, false);
  expect(track).toHaveBeenCalledTimes(2);
});
it("reports retries with the response remaining count", async () => {
  const { trackGenerationSuccess } = await import("../model/generation-analytics");
  trackGenerationSuccess(response("same", 4), {}, true);
  trackGenerationSuccess(response("same", 0), {}, true);
  expect(track.mock.calls).toEqual([["course_regenerated", {
    retry_index: 1,
    remaining_retries: 4
  }], ["course_regenerated", {
    retry_index: 5,
    remaining_retries: 0
  }]]);
});
it("uses memory deduplication when storage throws", async () => {
  vi.stubGlobal("sessionStorage", {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    }
  });
  const { trackGenerationSuccess } = await import("../model/generation-analytics");
  trackGenerationSuccess(response("one"), {}, false);
  trackGenerationSuccess(response("one"), {}, false);
  expect(track).toHaveBeenCalledTimes(1);
});
