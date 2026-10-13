import { afterEach, describe, expect, it, vi } from "vitest";

import {
  scheduleSituationStepGuideDismiss,
  shouldShowSituationStepGuide,
} from "./useSituationStepGuideVisibility";

describe("situation step guide entry policy", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the guide on a fresh time-step entry without a step query", () => {
    expect(
      shouldShowSituationStepGuide({
        step: "time",
        hasExplicitStep: false,
      }),
    ).toBe(true);
  });

  it.each(["time", "region", "purpose", "result", "course"] as const)(
    "does not show for an explicit or non-entry step: %s",
    (step) => {
      expect(
        shouldShowSituationStepGuide({
          step,
          hasExplicitStep: true,
        }),
      ).toBe(false);
    },
  );

  it("does not show when a deep link resolves directly to another step", () => {
    expect(
      shouldShowSituationStepGuide({
        step: "region",
        hasExplicitStep: false,
      }),
    ).toBe(false);
    expect(
      shouldShowSituationStepGuide({
        step: "purpose",
        hasExplicitStep: false,
      }),
    ).toBe(false);
  });

  it("shows the guide again on every fresh entry", () => {
    const entry = {
      step: "time" as const,
      hasExplicitStep: false,
    };

    expect(shouldShowSituationStepGuide(entry)).toBe(true);
    expect(shouldShowSituationStepGuide(entry)).toBe(true);
  });

  it("dismisses the guide after the configured duration", () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();

    scheduleSituationStepGuideDismiss(2000, dismiss);
    vi.advanceTimersByTime(1999);
    expect(dismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
