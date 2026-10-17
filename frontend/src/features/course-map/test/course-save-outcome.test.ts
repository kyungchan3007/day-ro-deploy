import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock("@/shared/analytics", () => ({ trackEvent: mocks.track }));

import type { CourseSaveRequest } from "../../../shared/api/openapi/dayro.openapi";
import { CourseSaveRequestError } from "../api/save-course";
import { isUnauthorizedSaveError, trackCourseSaved } from "../lib/course-save-outcome";

beforeEach(() => {
  mocks.track.mockReset();
});

describe("isUnauthorizedSaveError (issue #229)", () => {
  it("저장 요청 401 만 로그인 만료로 본다", () => {
    expect(isUnauthorizedSaveError(new CourseSaveRequestError(401, "x"))).toBe(true);
    expect(isUnauthorizedSaveError(new CourseSaveRequestError(500, "x"))).toBe(false);
    expect(isUnauthorizedSaveError(Object.assign(new Error("x"), { status: 401 }))).toBe(false);
    expect(isUnauthorizedSaveError(null)).toBe(false);
  });
});

describe("trackCourseSaved (issue #229)", () => {
  it("장소 수만 담아 course_saved 를 보낸다", () => {
    const request = { title: "private", places: [{}, {}, {}] } as unknown as CourseSaveRequest;
    trackCourseSaved(request);
    expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_saved", { place_count: 3 });
  });
});
