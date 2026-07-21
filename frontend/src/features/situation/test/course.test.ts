import { describe, expect, it } from "vitest";

import {
  getNextSituationStep,
  getPreviousSituationStep,
  patchSituationAnswers,
  resolveSituationStep,
  SITUATION_LOADING_STEP,
  SITUATION_STEPS,
  TOTAL_SITUATION_STEPS,
} from "../model/flow";
import {
  exceedsMaxDuration,
  MAX_SITUATION_DURATION_MINUTES,
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
      region: "gangnam",
    });

    expect(withRegion).toEqual({
      time: {
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 1, minute: 0 },
      },
      region: "gangnam",
    });
  });

  it("limits the meeting duration to 10 hours from the start time", () => {
    expect(MAX_SITUATION_DURATION_MINUTES).toBe(600);
    expect(
      exceedsMaxDuration({
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 8, minute: 0 },
      }),
    ).toBe(false);
    expect(
      exceedsMaxDuration({
        start: { meridiem: "오전", hour: 10, minute: 0 },
        end: { meridiem: "오후", hour: 8, minute: 5 },
      }),
    ).toBe(true);
  });
});
