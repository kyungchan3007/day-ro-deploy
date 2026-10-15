import { afterEach, describe, expect, it, vi } from "vitest";

import { requestCourseCandidates, requestRetriedCourseCandidates } from "../api/submit";
import {
  CourseCandidatesRequestError,
  RATE_LIMITED_MESSAGE,
  resolveGenerationFailureMessage,
} from "../model/generation-failure";
import type { SituationInputRequest } from "../../../shared/api/openapi/dayro.openapi";

const request = {} as SituationInputRequest;

function mockFetch(status: number, body: string) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
}

async function captureError(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  throw new Error("expected rejection");
}

describe("course candidates request errors (issue #161)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps status and the BFF message for a JSON error", async () => {
    mockFetch(429, JSON.stringify({ success: false, message: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.", data: null }));
    const error = await captureError(() => requestCourseCandidates(request));

    expect(error).toBeInstanceOf(CourseCandidatesRequestError);
    expect(error).toMatchObject({ status: 429, serverMessage: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." });
  });

  it("drops a non-JSON body such as the Cloudflare block page", async () => {
    mockFetch(429, "<!DOCTYPE html><html><body>Error 1015</body></html>");
    const error = await captureError(() => requestRetriedCourseCandidates("request-1"));

    expect(error).toMatchObject({ status: 429, serverMessage: undefined, message: "course_candidates_retry_failed" });
  });

  it("ignores an empty or oversized message", async () => {
    mockFetch(429, JSON.stringify({ message: "x".repeat(201) }));
    expect(await captureError(() => requestCourseCandidates(request))).toMatchObject({ serverMessage: undefined });

    mockFetch(429, JSON.stringify({ message: "   " }));
    expect(await captureError(() => requestCourseCandidates(request))).toMatchObject({ serverMessage: undefined });
  });
});

describe("resolveGenerationFailureMessage (issue #161)", () => {
  it("uses the server message for a 429 with a message", () => {
    const error = new CourseCandidatesRequestError("course_candidates_failed", 429, "오늘의 코스 추천 요청 한도를 모두 사용했어요. 내일 다시 이용해주세요.");
    expect(resolveGenerationFailureMessage(error)).toBe("오늘의 코스 추천 요청 한도를 모두 사용했어요. 내일 다시 이용해주세요.");
  });

  it("uses the rate limit notice for a 429 without a message", () => {
    const error = new CourseCandidatesRequestError("course_candidates_failed", 429);
    expect(resolveGenerationFailureMessage(error)).toBe(RATE_LIMITED_MESSAGE);
  });

  it("falls back to the default message for other failures", () => {
    expect(resolveGenerationFailureMessage(new CourseCandidatesRequestError("course_candidates_failed", 503, "점검 중"))).toBeUndefined();
    expect(resolveGenerationFailureMessage(new CourseCandidatesRequestError("course_candidates_failed", 400, "잘못된 요청"))).toBeUndefined();
    expect(resolveGenerationFailureMessage(new TypeError("Failed to fetch"))).toBeUndefined();
    expect(resolveGenerationFailureMessage(undefined)).toBeUndefined();
  });
});
