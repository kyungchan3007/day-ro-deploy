import { describe, expect, it } from "vitest";

import {
  getNextSituationStep,
  getPreviousSituationStep,
  SITUATION_STEPS,
  TOTAL_SITUATION_STEPS,
} from "./flow";

describe("situation flow", () => {
  it("uses a three-step input flow before loading", () => {
    expect(SITUATION_STEPS.map((step) => step.key)).toEqual([
      "time",
      "region",
      "transport",
    ]);
    expect(TOTAL_SITUATION_STEPS).toBe(3);
  });

  it("moves from transport directly to generation loading boundary", () => {
    expect(getPreviousSituationStep("transport")).toBe("region");
    expect(getNextSituationStep("transport")).toBeNull();
  });
});
