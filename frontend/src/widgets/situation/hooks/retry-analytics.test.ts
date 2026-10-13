import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  record: vi.fn(),
  remaining: 0 as number | undefined,
}));

vi.mock("@/shared/analytics", () => ({
  trackEvent: mocks.track,
}));
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useEffect: vi.fn(),
  useRef: (current: unknown) => ({ current }),
  useCallback: (callback: unknown) => callback,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/features/loading-quiz", () => ({
  useChosungQuiz: () => ({}),
}));
vi.mock("@/shared/ui/toast", () => ({
  useToast: () => ({ show: vi.fn() }),
}));
vi.mock("./useSituationStepGuideVisibility", () => ({
  useSituationStepGuideVisibility: () => false,
}));
vi.mock("@/features/situation", async (original) => ({
  ...(await original<typeof import("@/features/situation")>()),
  useCourseGeneration: () => ({ phase: "pending", result: null, interrupted: false }),
  recordCourseFlowSnapshot: mocks.record,
  useCourseFlowSnapshot: () => ({
    status: "ready",
    snapshot: {
      step: "result",
      answers: {},
      requestId: "private-request",
      candidates: [],
      selectedPlaces: [],
      createdAt: 0,
    },
    retries: mocks.remaining == null ? {} : { "private-request": mocks.remaining },
  }),
}));

import { useSituationFlowController } from "./useSituationFlowController";
import { SITUATION_RESULT_STEP } from "@/features/situation";

beforeEach(() => {
  mocks.track.mockReset();
  mocks.push.mockReset();
  mocks.record.mockReset();
  mocks.record.mockReturnValue("k3x9ab2m");
});

it("tracks each exhausted click without navigating; normal reroll sends no limit event", () => {
  mocks.remaining = 0;
  const exhausted = useSituationFlowController({ step: SITUATION_RESULT_STEP, rev: "abcd1234" });
  if (exhausted.kind !== "result") {
    throw Error("result expected");
  }
  exhausted.handleReroll();
  exhausted.handleReroll();
  expect(mocks.track.mock.calls).toEqual([
    ["course_retry_limit_reached", { retry_limit: 5 }],
    ["course_retry_limit_reached", { retry_limit: 5 }],
  ]);
  expect(mocks.push).not.toHaveBeenCalled();

  mocks.remaining = 1;
  mocks.track.mockClear();
  const available = useSituationFlowController({ step: SITUATION_RESULT_STEP, rev: "abcd1234" });
  if (available.kind !== "result") {
    throw Error("result expected");
  }
  available.handleReroll();
  expect(mocks.track).not.toHaveBeenCalled();
  expect(mocks.push).toHaveBeenCalledTimes(1);
});

it("records a retry operation in the flow state and navigates with only step and rev", () => {
  mocks.remaining = 2;
  const flow = useSituationFlowController({ step: SITUATION_RESULT_STEP, rev: "abcd1234" });
  if (flow.kind !== "result") {
    throw Error("result expected");
  }

  flow.handleReroll();

  expect(mocks.record).toHaveBeenCalledWith(
    expect.objectContaining({
      step: "loading",
      requestId: "private-request",
      // 재추천 실패 시 결과 화면을 되돌릴 수 있게 현재 후보를 함께 기록한다(issue #143).
      candidates: [],
      operation: expect.objectContaining({ kind: "retry", requestId: "private-request" }),
    }),
    ["abcd1234"],
  );
  expect(mocks.push).toHaveBeenCalledWith("/course/new/?step=loading&rev=k3x9ab2m");
  expect(String(mocks.push.mock.calls[0][0])).not.toContain("private-request");
});
