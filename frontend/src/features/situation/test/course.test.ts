import { describe, expect, it } from "vitest";

import {
  getNextSituationStep,
  getPreviousSituationStep,
  patchSituationAnswers,
  resolveSituationStep,
  SITUATION_COURSE_STEP,
  SITUATION_LOADING_STEP,
  SITUATION_RESULT_STEP,
  SITUATION_STEPS,
  TOTAL_SITUATION_STEPS,
} from "../model/flow";
import {
  belowMinDuration,
  exceedsMaxDuration,
  MAX_SITUATION_DURATION_MINUTES,
  MIN_SITUATION_DURATION_MINUTES,
} from "../model/time";
import type { SituationAnswers } from "../model/types";

describe("Course domain", () => {
  it("uses a three-step input flow before loading", () => {
    expect(SITUATION_STEPS.map((step) => step.key)).toEqual([
      "time",
      "region",
      "purpose",
    ]);
    expect(TOTAL_SITUATION_STEPS).toBe(3);
    expect(resolveSituationStep("loading")).toBe(SITUATION_LOADING_STEP);
    expect(resolveSituationStep("result")).toBe(SITUATION_RESULT_STEP);
    expect(resolveSituationStep("course")).toBe(SITUATION_COURSE_STEP);
    expect(resolveSituationStep("purpose")).toBe("purpose");
    expect(resolveSituationStep("transport")).toBe("time");
    expect(resolveSituationStep("unknown")).toBe("time");
  });

  it("moves from region to purpose before generation loading", () => {
    expect(getPreviousSituationStep("purpose")).toBe("region");
    expect(getNextSituationStep("region")).toBe("purpose");
  });

  it("accumulates answers across the situation input flow", () => {
    const initial: SituationAnswers = {};
    const withTime = patchSituationAnswers(initial, {
      time: {
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 1, minute: 0 },
      },
    });
    const withRegion = patchSituationAnswers(withTime, {
      region: {
        districtId: "3120210",
        label: "강남",
      },
    });

    expect(withRegion).toEqual({
      time: {
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 1, minute: 0 },
      },
      region: {
        districtId: "3120210",
        label: "강남",
      },
    });
  });

  it("limits the meeting duration to 12 hours from the start time", () => {
    expect(MAX_SITUATION_DURATION_MINUTES).toBe(720);
    // 오전 10:00 ~ 오후 10:00 = 정확히 12시간 → 허용
    expect(
      exceedsMaxDuration({
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 10, minute: 0 },
      }),
    ).toBe(false);
    // 12시간 5분 → 초과
    expect(
      exceedsMaxDuration({
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 10, minute: 5 },
      }),
    ).toBe(true);
  });

  it("requires the meeting duration to be at least 2 hours", () => {
    expect(MIN_SITUATION_DURATION_MINUTES).toBe(120);
    // 정확히 2시간 → 허용
    expect(
      belowMinDuration({
        start: { meridiem: "오후", hour: 6, minute: 0 },
        end: { meridiem: "오후", hour: 8, minute: 0 },
      }),
    ).toBe(false);
    // 1시간 55분 → 최소 미달
    expect(
      belowMinDuration({
        start: { meridiem: "오후", hour: 6, minute: 0 },
        end: { meridiem: "오후", hour: 7, minute: 55 },
      }),
    ).toBe(true);
  });
});
