import { afterEach, describe, expect, it, vi } from "vitest";

import {
  COURSE_FLOW_TTL_MS,
  MAX_COURSE_FLOW_REVISIONS,
  appendCourseFlowSnapshot,
  createCourseFlowRev,
  createEmptyCourseFlowState,
  isCourseFlowRev,
  isCourseFlowSnapshotUsable,
  parseCourseFlowState,
  pruneCourseFlowState,
  readCourseFlowSnapshot,
  resolveCourseFlowFallbackStep,
  setCourseFlowOperation,
  setCourseFlowRemainingRetries,
  type CourseFlowSnapshotInput,
} from "../model/course-flow";
import {
  COURSE_FLOW_STORAGE_KEY,
  getCourseFlowState,
  recordCourseFlowSnapshot,
  resetCourseFlowStateCacheForTest,
  updateCourseFlowState,
} from "../lib/course-flow-storage";
import type { SituationAnswers } from "../model/types";

const completeAnswers: SituationAnswers = {
  time: {
    start: { meridiem: "오후", hour: 6, minute: 0 },
    end: { meridiem: "오후", hour: 9, minute: 0 },
  },
  region: { districtId: "11680", label: "역삼동" },
  purpose: "date",
};

const place = {
  placeId: "place-1",
  name: "성수 브런치",
  category: "CAFE",
  district: "성수",
  address: "서울 성동구 성수이로 10",
  rating: 4.7,
  userRatingCount: 128,
  businessHours: "매일 10:00-22:00",
  latitude: 37.5441,
  longitude: 127.0557,
};

function input(overrides: Partial<CourseFlowSnapshotInput> = {}): CourseFlowSnapshotInput {
  return {
    step: "result",
    answers: completeAnswers,
    requestId: "request-1",
    candidates: [place],
    selectedPlaces: [],
    ...overrides,
  };
}

describe("course flow model", () => {
  it("creates unique 8-char lowercase base36 revs", () => {
    const revs = new Set(Array.from({ length: 200 }, () => createCourseFlowRev()));

    expect(revs.size).toBe(200);
    for (const rev of revs) {
      expect(isCourseFlowRev(rev)).toBe(true);
    }
    expect(isCourseFlowRev("ABCDEFGH")).toBe(false);
    expect(isCourseFlowRev("abc")).toBe(false);
  });

  it("never overwrites an existing snapshot when appending", () => {
    const first = appendCourseFlowSnapshot(createEmptyCourseFlowState(), input(), 1_000);
    const second = appendCourseFlowSnapshot(first.state, input({ candidates: [] }), 2_000);

    expect(second.rev).not.toBe(first.rev);
    expect(second.state.revisions[first.rev].candidates).toEqual([place]);
    expect(second.state.revisions[second.rev].candidates).toEqual([]);
    expect(second.state.order).toEqual([first.rev, second.rev]);
  });

  it("treats expired or future snapshots as missing", () => {
    const { state, rev } = appendCourseFlowSnapshot(createEmptyCourseFlowState(), input(), 1_000);

    expect(readCourseFlowSnapshot(state, rev, 1_000 + COURSE_FLOW_TTL_MS - 1)).not.toBeNull();
    expect(readCourseFlowSnapshot(state, rev, 1_000 + COURSE_FLOW_TTL_MS)).toBeNull();
    expect(readCourseFlowSnapshot(state, rev, 999)).toBeNull();
    expect(readCourseFlowSnapshot(state, "invalid", 1_000)).toBeNull();
  });

  it("evicts the oldest snapshots beyond the limit while protecting the current rev", () => {
    let state = createEmptyCourseFlowState();
    const revs: string[] = [];
    for (let index = 0; index < MAX_COURSE_FLOW_REVISIONS; index += 1) {
      const appended = appendCourseFlowSnapshot(state, input(), 1_000 + index);
      state = appended.state;
      revs.push(appended.rev);
    }

    const protectedRev = revs[0];
    const next = appendCourseFlowSnapshot(state, input(), 5_000, [protectedRev]);

    expect(next.state.order).toHaveLength(MAX_COURSE_FLOW_REVISIONS);
    expect(next.state.revisions[protectedRev]).toBeDefined();
    expect(next.state.revisions[revs[1]]).toBeUndefined();
  });

  it("drops operations and retries that no remaining snapshot references", () => {
    let state = appendCourseFlowSnapshot(
      createEmptyCourseFlowState(),
      input({ step: "loading", operation: { id: "op-1", kind: "initial" } }),
      1_000,
    ).state;
    state = setCourseFlowOperation(state, "op-1", { status: "pending" });
    state = setCourseFlowOperation(state, "orphan", { status: "pending" });
    state = setCourseFlowRemainingRetries(state, "request-1", 3);
    state = setCourseFlowRemainingRetries(state, "orphan-request", 1);

    const pruned = pruneCourseFlowState(state, 2_000);

    expect(Object.keys(pruned.operations)).toEqual(["op-1"]);
    expect(pruned.retries).toEqual({ "request-1": 3 });
  });

  it("decides whether a snapshot can render the requested step", () => {
    const base = { candidates: [], selectedPlaces: [], createdAt: 0 };

    expect(isCourseFlowSnapshotUsable("region", { ...base, step: "region", answers: {} })).toBe(false);
    expect(
      isCourseFlowSnapshotUsable("purpose", {
        ...base,
        step: "purpose",
        answers: { time: completeAnswers.time, region: completeAnswers.region },
      }),
    ).toBe(true);
    expect(isCourseFlowSnapshotUsable("loading", { ...base, step: "loading", answers: completeAnswers })).toBe(false);
    expect(
      isCourseFlowSnapshotUsable("loading", {
        ...base,
        step: "loading",
        answers: completeAnswers,
        operation: { id: "op", kind: "initial" },
      }),
    ).toBe(true);
    expect(
      isCourseFlowSnapshotUsable("course", {
        ...base,
        step: "course",
        answers: completeAnswers,
        requestId: "request-1",
      }),
    ).toBe(false);
    expect(
      isCourseFlowSnapshotUsable("result", {
        ...base,
        step: "course",
        answers: completeAnswers,
        requestId: "request-1",
      }),
    ).toBe(false);
  });

  it("falls back to purpose for complete answers, otherwise the first incomplete step", () => {
    expect(resolveCourseFlowFallbackStep(completeAnswers)).toBe("purpose");
    expect(resolveCourseFlowFallbackStep({ time: completeAnswers.time })).toBe("region");
    expect(resolveCourseFlowFallbackStep({})).toBe("time");
  });

  it("parses only valid versioned state", () => {
    const { state } = appendCourseFlowSnapshot(createEmptyCourseFlowState(), input(), 1_000);

    expect(parseCourseFlowState(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(parseCourseFlowState({ ...state, version: 2 })).toEqual(createEmptyCourseFlowState());
    expect(parseCourseFlowState("broken")).toEqual(createEmptyCourseFlowState());
  });

  it("drops only invalid records and keeps the rest of the tab history", () => {
    const first = appendCourseFlowSnapshot(createEmptyCourseFlowState(), input(), 1_000);
    const second = appendCourseFlowSnapshot(first.state, input({ requestId: "request-2" }), 2_000);
    const stored = JSON.parse(JSON.stringify(second.state));
    stored.revisions[first.rev].candidates = "broken";
    stored.operations = { ok: { status: "pending" }, bad: { status: "unknown" } };
    stored.retries = { "request-2": 2, broken: -1 };

    const parsed = parseCourseFlowState(stored);

    expect(parsed.revisions[first.rev]).toBeUndefined();
    expect(parsed.revisions[second.rev].requestId).toBe("request-2");
    expect(Object.keys(parsed.operations)).toEqual(["ok"]);
    expect(parsed.retries).toEqual({ "request-2": 2 });
  });
});

describe("course flow storage", () => {
  afterEach(() => {
    resetCourseFlowStateCacheForTest();
    vi.unstubAllGlobals();
  });

  function stubStorage(storage: Partial<Storage>) {
    vi.stubGlobal("window", { sessionStorage: storage });
  }

  it("persists snapshots to sessionStorage and restores them after a reload", () => {
    const values = new Map<string, string>();
    stubStorage({
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        values.set(key, value);
      },
    });

    const rev = recordCourseFlowSnapshot(input());
    resetCourseFlowStateCacheForTest();

    expect(values.has(COURSE_FLOW_STORAGE_KEY)).toBe(true);
    expect(getCourseFlowState().revisions[rev].requestId).toBe("request-1");
  });

  it("keeps the flow in memory when storage access throws", () => {
    stubStorage({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    });

    const rev = recordCourseFlowSnapshot(input());

    expect(getCourseFlowState().revisions[rev]).toBeDefined();
    expect(() => updateCourseFlowState((state) => state)).not.toThrow();
  });

  it("starts empty when stored data is corrupted", () => {
    stubStorage({ getItem: () => "{not json", setItem: () => {} });

    expect(getCourseFlowState()).toEqual(createEmptyCourseFlowState());
  });
});
