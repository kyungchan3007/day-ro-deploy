import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearToastTimer, scheduleToastDismiss } from "./useToast";

describe("toast timer helpers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("clears a previous timer before scheduling the next dismiss", () => {
    const timer = { current: null as ReturnType<typeof setTimeout> | null };
    const firstDismiss = vi.fn();
    const secondDismiss = vi.fn();

    scheduleToastDismiss(timer, 1000, firstDismiss);
    const firstTimer = timer.current;
    scheduleToastDismiss(timer, 1000, secondDismiss);

    expect(timer.current).not.toBe(firstTimer);

    vi.advanceTimersByTime(1000);

    expect(firstDismiss).not.toHaveBeenCalled();
    expect(secondDismiss).toHaveBeenCalledTimes(1);
    expect(timer.current).toBeNull();
  });

  it("nulls the timer reference when cleared manually", () => {
    const timer = { current: null as ReturnType<typeof setTimeout> | null };

    scheduleToastDismiss(timer, 1000, vi.fn());
    clearToastTimer(timer);

    expect(timer.current).toBeNull();
  });
});
