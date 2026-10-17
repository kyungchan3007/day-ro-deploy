import { describe, expect, it } from "vitest";

import {
  buildCourseRouteUrl,
  getFirstIncompleteSituationStep,
  parseCourseRoute,
} from "../model/url-state";
import type { SituationAnswers } from "../model/types";

function sampleAnswers(): SituationAnswers {
  return {
    time: {
      start: { meridiem: "오후", hour: 6, minute: 0 },
      end: { meridiem: "오후", hour: 9, minute: 0 },
    },
    region: {
      districtId: "11680",
      label: "역삼동",
    },
    purpose: "date",
  };
}

describe("course route url contract (issue #129)", () => {
  it("serializes only step and rev", () => {
    const url = buildCourseRouteUrl({ step: "result", rev: "k3x9ab2m" });

    expect(url).toBe("/course/new/?step=result&rev=k3x9ab2m");
    expect(parseCourseRoute(new URL(url, "http://localhost").searchParams)).toEqual({
      step: "result",
      rev: "k3x9ab2m",
      isClean: true,
      attribution: {},
    });
  });

  it("omits rev for the first entry and keeps only allowlisted attribution keys", () => {
    expect(buildCourseRouteUrl({ step: "time" })).toBe("/course/new/?step=time");
    expect(
      buildCourseRouteUrl({
        step: "time",
        attribution: { utm_source: "instagram", requestId: "secret", rev: "k3x9ab2m" },
      }),
    ).toBe("/course/new/?step=time&utm_source=instagram");
  });

  it("treats attribution keys as clean but any state query as legacy", () => {
    expect(parseCourseRoute({ step: "time", utm_source: "instagram", gclid: "g" })).toEqual({
      step: "time",
      rev: undefined,
      isClean: true,
      attribution: { utm_source: "instagram", gclid: "g" },
    });
    expect(parseCourseRoute({ step: "result", requestId: "request-1" }).isClean).toBe(false);
    expect(parseCourseRoute({ step: "course", selectedPlaces: "[]" }).isClean).toBe(false);
    expect(parseCourseRoute({ step: "purpose", purpose: "date" }).isClean).toBe(false);
  });

  it("rejects malformed rev, unknown step and duplicated keys", () => {
    expect(parseCourseRoute({ step: "result", rev: "K3X9AB2M" })).toMatchObject({
      rev: undefined,
      isClean: false,
    });
    expect(parseCourseRoute({ step: "nope" })).toMatchObject({ step: "time", isClean: false });
    expect(
      parseCourseRoute(new URLSearchParams("step=result&step=course&rev=k3x9ab2m")).isClean,
    ).toBe(false);
  });

  it("treats a bare entry as a clean time step", () => {
    expect(parseCourseRoute({})).toEqual({
      step: "time",
      rev: undefined,
      isClean: true,
      attribution: {},
    });
  });

  it("returns the first incomplete situation step", () => {
    const answers = sampleAnswers();

    expect(getFirstIncompleteSituationStep({})).toBe("time");
    expect(getFirstIncompleteSituationStep({ time: answers.time })).toBe("region");
    expect(
      getFirstIncompleteSituationStep({ time: answers.time, region: answers.region }),
    ).toBe("purpose");
    expect(getFirstIncompleteSituationStep(answers)).toBeNull();
  });
});
