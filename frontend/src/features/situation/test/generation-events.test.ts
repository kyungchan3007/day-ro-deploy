import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type { CourseFlowState } from "../model/course-flow";

const mocks = vi.hoisted(() => ({
  initial: vi.fn(),
  retry: vi.fn(),
  track: vi.fn(),
  effects: [] as (() => void | (() => void))[],
  cleanup: [] as (() => void)[],
  setters: [] as ReturnType<typeof vi.fn>[],
  cursor: 0,
  state: null as unknown as CourseFlowState,
}));

vi.mock("react", () => ({
  useState: (initial: unknown) => {
    const setter = vi.fn();
    mocks.setters[mocks.cursor++] = setter;
    return [initial, setter];
  },
  useEffect: (effect: () => void | (() => void)) => {
    mocks.effects.push(effect);
  },
}));
vi.mock("../api/submit", () => ({
  requestCourseCandidates: mocks.initial,
  requestRetriedCourseCandidates: mocks.retry,
}));
vi.mock("../lib/course-flow-storage", () => ({
  getCourseFlowState: () => mocks.state,
  updateCourseFlowState: (update: (state: CourseFlowState) => CourseFlowState) => {
    mocks.state = update(mocks.state);
    return mocks.state;
  },
}));
vi.mock("@/shared/analytics", () => ({
  trackEvent: mocks.track,
}));

import { useCourseGeneration } from "../hooks/useCourseGeneration";
import { createEmptyCourseFlowState } from "../model/course-flow";

// useState 호출 순서: apiStatus, minElapsed, result, interrupted
const SET_INTERRUPTED = 3;

const answers = {
  purpose: "date" as const,
  region: { districtId: "id", label: "private" },
  time: {
    start: { meridiem: "오후" as const, hour: 1, minute: 0 },
    end: { meridiem: "오후" as const, hour: 3, minute: 0 },
  },
};

function response(requestId: string, remainingRetries: number) {
  return { success: true, message: "ok", data: { requestId, remainingRetries, places: [] } };
}

function GenerationProbe(options: Parameters<typeof useCourseGeneration>[0]) {
  return useCourseGeneration(options);
}

async function render(options: Partial<Parameters<typeof useCourseGeneration>[0]> = {}) {
  mocks.cursor = 0;
  mocks.effects = [];
  GenerationProbe({ active: true, answers, ...options });
  for (const effect of mocks.effects) {
    const cleanup = effect();
    if (cleanup) {
      mocks.cleanup.push(cleanup);
    }
  }
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.track.mockReset();
  mocks.initial.mockReset();
  mocks.retry.mockReset();
  mocks.state = createEmptyCourseFlowState();
});

afterEach(() => {
  mocks.cleanup.forEach((fn) => fn());
  mocks.cleanup = [];
  vi.useRealTimers();
});

it("tracks an initial success once and records the operation and remaining retries", async () => {
  mocks.initial.mockResolvedValue(response("hook-success", 5));

  await render({ operation: { id: "op-initial", kind: "initial" } });

  expect(mocks.initial).toHaveBeenCalledTimes(1);
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith(
    "course_generated",
    expect.objectContaining({ purpose: "date" }),
  );
  expect(mocks.state.operations["op-initial"]).toMatchObject({ status: "done" });
  expect(mocks.state.retries["hook-success"]).toBe(5);
});

it("does not request or track while inactive or without an operation", async () => {
  await render({ active: false, operation: { id: "op-x", kind: "initial" } });
  await render({ operation: undefined });

  expect(mocks.initial).not.toHaveBeenCalled();
  expect(mocks.track).not.toHaveBeenCalled();
});

it("reuses a completed operation without requesting or tracking again", async () => {
  mocks.state = {
    ...createEmptyCourseFlowState(),
    operations: { "op-done": { status: "done", response: response("done", 3) } },
  };

  await render({ operation: { id: "op-done", kind: "initial" } });

  expect(mocks.initial).not.toHaveBeenCalled();
  expect(mocks.track).not.toHaveBeenCalled();
});

it("marks a pending operation without a live request as interrupted instead of resubmitting", async () => {
  mocks.state = {
    ...createEmptyCourseFlowState(),
    operations: { "op-lost": { status: "pending" } },
  };

  await render({ operation: { id: "op-lost", kind: "initial" } });

  expect(mocks.initial).not.toHaveBeenCalled();
  expect(mocks.setters[SET_INTERRUPTED]).toHaveBeenCalledWith(true);
});

it("reattaches to a live retry in the same document without a duplicate request or event", async () => {
  let resolveRetry: (value: unknown) => void = () => {};
  mocks.retry.mockReturnValue(new Promise((resolve) => {
    resolveRetry = resolve;
  }));
  const operation = { id: "op-retry", kind: "retry" as const, requestId: "hook-retry" };

  await render({ operation });
  await render({ operation });
  resolveRetry(response("hook-retry", 4));
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }

  expect(mocks.retry).toHaveBeenCalledTimes(1);
  expect(mocks.setters[SET_INTERRUPTED]).not.toHaveBeenCalledWith(true);
  expect(mocks.track).toHaveBeenCalledExactlyOnceWith("course_regenerated", {
    retry_index: 1,
    remaining_retries: 4,
  });
  expect(mocks.state.retries["hook-retry"]).toBe(4);
});

it("does not track failed requests", async () => {
  mocks.initial.mockRejectedValue(new Error("fail"));

  await render({ operation: { id: "op-fail", kind: "initial" } });

  expect(mocks.track).not.toHaveBeenCalled();
});

it("records a failed request and does not resubmit a failed operation", async () => {
  mocks.initial.mockRejectedValue(new Error("fail"));
  await render({ operation: { id: "op-failed", kind: "initial" } });
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
  }
  expect(mocks.state.operations["op-failed"]).toEqual({ status: "failed" });

  mocks.initial.mockClear();
  await render({ operation: { id: "op-failed", kind: "initial" } });
  expect(mocks.initial).not.toHaveBeenCalled();
  // useState 호출 순서상 0번이 apiStatus
  expect(mocks.setters[0]).toHaveBeenCalledWith("error");
});
