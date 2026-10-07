import { beforeEach, describe, expect, it, vi } from "vitest";

// node 환경(렌더러 없음)에서 effect 를 즉시 실행해 리다이렉트 판단만 검증한다.
vi.mock("react", async (original) => ({
  ...(await original<typeof import("react")>()),
  useEffect: (effect: () => void) => effect(),
  useRef: (current: unknown) => ({ current }),
}));

import { useCourseFlowRedirects, type UseCourseFlowRedirectsOptions } from "./useCourseFlowRedirects";
import { SITUATION_FLOW_MESSAGES } from "./situation-flow-messages";

const place = {
  placeId: "place-1",
  name: "경복궁",
  category: "고궁",
  district: "종로구",
  address: "서울 종로구 사직로 161",
  rating: 4.8,
  userRatingCount: 100,
  businessHours: null,
  latitude: 37.5,
  longitude: 127,
};

const answers = {
  time: { start: { meridiem: "오후", hour: 6, minute: 0 }, end: { meridiem: "오후", hour: 9, minute: 0 } },
  region: { districtId: "1", label: "서촌" },
  purpose: "date",
} as UseCourseFlowRedirectsOptions["answers"];

function options(overrides: Partial<UseCourseFlowRedirectsOptions>): UseCourseFlowRedirectsOptions {
  return {
    step: "loading",
    rev: "abcd1234",
    restoreReady: true,
    fallbackAnswers: null,
    answers,
    operationId: "op-1",
    operationKind: "retry",
    requestId: "request-1",
    candidates: [place],
    generationFailed: true,
    generationInterrupted: false,
    recordStepUrl: vi.fn(() => "/course/new/?step=x&rev=k3x9ab2m"),
    replace: vi.fn(),
    show: vi.fn(),
    ...overrides,
  };
}

describe("useCourseFlowRedirects on failed generation (issue #143)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns a failed retry to the same result (requestId·candidates kept)", () => {
    const opts = options({});
    useCourseFlowRedirects(opts);

    expect(opts.recordStepUrl).toHaveBeenCalledWith({
      step: "result",
      answers,
      requestId: "request-1",
      candidates: [place],
      selectedPlaces: [],
    });
    expect(opts.show).toHaveBeenCalledWith(SITUATION_FLOW_MESSAGES.retryFailed, "info");
    expect(opts.replace).toHaveBeenCalledTimes(1);
  });

  it("returns an interrupted retry to the same result with the interrupted notice", () => {
    const opts = options({ generationFailed: false, generationInterrupted: true });
    useCourseFlowRedirects(opts);

    expect(opts.recordStepUrl).toHaveBeenCalledWith(expect.objectContaining({ step: "result", requestId: "request-1" }));
    expect(opts.show).toHaveBeenCalledWith(SITUATION_FLOW_MESSAGES.retryInterrupted, "info");
  });

  it("sends a failed initial generation back to purpose", () => {
    const opts = options({ operationKind: "initial", requestId: undefined, candidates: [] });
    useCourseFlowRedirects(opts);

    expect(opts.recordStepUrl).toHaveBeenCalledWith({ step: "purpose", answers, candidates: [], selectedPlaces: [] });
    expect(opts.show).toHaveBeenCalledWith(SITUATION_FLOW_MESSAGES.generationFailed, "info");
  });

  it("falls back to purpose for an old retry snapshot without candidates", () => {
    const opts = options({ candidates: [] });
    useCourseFlowRedirects(opts);

    expect(opts.recordStepUrl).toHaveBeenCalledWith(expect.objectContaining({ step: "purpose" }));
  });

  it("does nothing while generation is still pending", () => {
    const opts = options({ generationFailed: false, generationInterrupted: false });
    useCourseFlowRedirects(opts);

    expect(opts.replace).not.toHaveBeenCalled();
    expect(opts.show).not.toHaveBeenCalled();
  });
});
