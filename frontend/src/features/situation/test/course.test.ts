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
import type { SituationAnswers } from "../model/types";

describe("Course domain", () => {
  it("uses a three-step input flow before loading", () => {
    expect(SITUATION_STEPS.map((step) => step.key)).toEqual([
      "time",
      "region",
      "transport",
    ]);
    expect(TOTAL_SITUATION_STEPS).toBe(3);
    expect(resolveSituationStep("loading")).toBe(SITUATION_LOADING_STEP);
  });

  it("moves from transport directly to generation loading boundary", () => {
    expect(getPreviousSituationStep("transport")).toBe("region");
    expect(getNextSituationStep("transport")).toBeNull();
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
});
