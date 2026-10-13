import { beforeEach, describe, expect, it, vi } from "vitest";

// The unit project uses Node. Supply pending state at the React boundary;
// exercise the real hook's action contract, not React's scheduling internals.
const transition = vi.hoisted(() => ({
  pending: false,
  start: vi.fn((action: () => void) => action()),
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useTransition: () => [transition.pending, transition.start],
}));

import { useCourseReroll } from "../hooks/useCourseReroll";

describe("useCourseReroll action contract", () => {
  beforeEach(() => {
    transition.pending = false;
    transition.start.mockClear();
  });

  it("preserves selection and delegates once without starting a transition when exhausted", () => {
    const resetSelection = vi.fn();
    const onReroll = vi.fn();
    const result = useCourseReroll({ exhausted: true, resetSelection, onReroll });

    result.handleReroll();

    expect(result.rerolling).toBe(false);
    expect(resetSelection).not.toHaveBeenCalled();
    expect(onReroll).toHaveBeenCalledTimes(1);
    expect(transition.start).not.toHaveBeenCalled();
  });

  it("clears selection before delegating a retry when retries remain", () => {
    const resetSelection = vi.fn();
    const onReroll = vi.fn();
    const result = useCourseReroll({ exhausted: false, resetSelection, onReroll });

    result.handleReroll();

    expect(result.rerolling).toBe(false);
    expect(resetSelection).toHaveBeenCalledTimes(1);
    expect(onReroll).toHaveBeenCalledTimes(1);
    expect(resetSelection.mock.invocationCallOrder[0]).toBeLessThan(
      onReroll.mock.invocationCallOrder[0],
    );
    expect(transition.start).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])("does nothing while pending, including exhausted=%s", (exhausted) => {
    transition.pending = true;
    const resetSelection = vi.fn();
    const onReroll = vi.fn();
    const result = useCourseReroll({ exhausted, resetSelection, onReroll });

    result.handleReroll();
    result.handleReroll();

    expect(result.rerolling).toBe(true);
    expect(resetSelection).not.toHaveBeenCalled();
    expect(onReroll).not.toHaveBeenCalled();
    expect(transition.start).not.toHaveBeenCalled();
  });

  it("keeps selection intact and delegates each repeated exhausted click", () => {
    const resetSelection = vi.fn();
    const onReroll = vi.fn();
    const { handleReroll } = useCourseReroll({ exhausted: true, resetSelection, onReroll });

    handleReroll();
    handleReroll();
    handleReroll();

    expect(resetSelection).not.toHaveBeenCalled();
    expect(onReroll).toHaveBeenCalledTimes(3);
    expect(transition.start).not.toHaveBeenCalled();
  });
});
