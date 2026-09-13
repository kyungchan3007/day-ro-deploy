import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import { LAST_GENERATED_COURSE_STORAGE_KEY } from "../lib/generated-course-storage";

const runtime = vi.hoisted(() => ({
  deps: undefined as readonly unknown[] | undefined,
  store: undefined as unknown,
  server: false,
  getSnapshot: undefined as undefined | (() => unknown),
  getServerSnapshot: undefined as undefined | (() => unknown),
}));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useMemo: (factory: () => unknown, deps: readonly unknown[]) => {
    if (!runtime.deps || deps.some((value, index) => !Object.is(value, runtime.deps?.[index]))) {
      runtime.deps = deps; runtime.store = factory();
    }
    return runtime.store;
  },
  useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown, getServerSnapshot: () => unknown) => {
    runtime.getSnapshot = getSnapshot; runtime.getServerSnapshot = getServerSnapshot;
    return runtime.server ? getServerSnapshot() : getSnapshot();
  },
}));
import { useRestoredCourseCandidates } from "../hooks/useRestoredCourseCandidates";
const places: PlaceCandidate[] = [{ placeId: "p1", name: "Cafe", category: "CAFE", district: "Seoul", address: "Seoul", rating: null, userRatingCount: null, businessHours: null, latitude: null, longitude: null }];
const input = { active: true, candidates: [] as PlaceCandidate[], requestId: "request", remainingRetries: 5 };
const fallback = { places: input.candidates, requestId: input.requestId, remainingRetries: 5 };
let storage: Map<string, string>;
function save(requestId = "request", remainingRetries = 0) {
  storage.set(LAST_GENERATED_COURSE_STORAGE_KEY, JSON.stringify({ success: true, message: "ok", data: { places, requestId, remainingRetries } }));
}
beforeEach(() => {
  runtime.deps = undefined; runtime.store = undefined; runtime.server = false;
  storage = new Map();
  vi.stubGlobal("window", { sessionStorage: { getItem: (key: string) => storage.get(key) ?? null } });
});
afterEach(() => vi.unstubAllGlobals());

describe("course result storage snapshots", () => {
  it("uses server props for SSR/hydration, then restores a matching stored result", () => {
    save(); runtime.server = true;
    expect(useRestoredCourseCandidates(input)).toEqual(fallback);
    runtime.server = false;
    expect(useRestoredCourseCandidates(input)).toEqual({ places, requestId: "request", remainingRetries: 0 });
    expect(runtime.getSnapshot?.()).toBe(runtime.getSnapshot?.());
    expect(runtime.getServerSnapshot?.()).toBe(runtime.getServerSnapshot?.());
  });
  it.each([null, '{', 'null', '{"data":null}', '{"success":true}'])("falls back for missing/corrupt storage %s", (raw) => {
    if (raw !== null) storage.set(LAST_GENERATED_COURSE_STORAGE_KEY, raw);
    expect(useRestoredCourseCandidates(input)).toEqual(fallback);
  });
  it("does not restore another request or read storage outside the result step", () => {
    save("other"); expect(useRestoredCourseCandidates(input)).toEqual(fallback);
    save(); expect(useRestoredCourseCandidates({ ...input, active: false })).toEqual(fallback);
    expect(useRestoredCourseCandidates(input).places).toEqual(places);
  });
  it("keeps the snapshot stable until route inputs change, including zero retries", () => {
    save("request", 1); const first = useRestoredCourseCandidates(input);
    save("request", 0); expect(useRestoredCourseCandidates(input)).toBe(first);
    expect(useRestoredCourseCandidates({ ...input, candidates: [...input.candidates] }).remainingRetries).toBe(0);
    expect(useRestoredCourseCandidates({ ...input, requestId: "next" }).requestId).toBe("next");
  });
});
