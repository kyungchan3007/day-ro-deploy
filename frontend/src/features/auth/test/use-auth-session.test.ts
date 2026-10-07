import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession } from "../model/session";

// Service-local hook harness: exercise async completion, rerenders and effect cleanup without a server.
const runtime = vi.hoisted(() => ({
  states: [] as unknown[], cursor: 0, dirty: false,
  effect: undefined as undefined | (() => void | (() => void)),
  cleanup: undefined as undefined | (() => void),
  dependency: undefined as boolean | undefined,
  nextDependency: undefined as boolean | undefined,
  request: vi.fn(),
}));
vi.mock("../api/session", () => ({ requestAuthSession: runtime.request }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useState: <T>(initial: T) => {
    const index = runtime.cursor++;
    if (!(index in runtime.states)) runtime.states[index] = initial;
    return [runtime.states[index], (next: T) => { runtime.states[index] = next; runtime.dirty = true; }];
  },
  useEffect: (effect: () => void | (() => void), deps: boolean[]) => {
    runtime.effect = effect;
    runtime.nextDependency = deps[0];
  },
}));
import { useAuthSession } from "../hooks/useAuthSession";

function SessionProbe({ enabled }: { enabled: boolean }) {
  return useAuthSession({ enabled });
}

function render(enabled = true) {
  let result;
  let attempts = 0;
  do {
    runtime.cursor = 0; runtime.dirty = false;
    result = SessionProbe({ enabled });
    if (++attempts > 10) throw new Error("Render loop");
  } while (runtime.dirty);
  if (runtime.nextDependency !== runtime.dependency) {
    runtime.cleanup?.();
    runtime.dependency = runtime.nextDependency;
    runtime.cleanup = runtime.effect?.() || undefined;
  }
  return result;
}
function pending() {
  let resolve!: (session: AuthSession) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<AuthSession>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const guest: AuthSession = { authenticated: false, user: null };
const user: AuthSession = { authenticated: true, user: {
  provider: "KAKAO", nickname: "Member", email: null, name: null, profileImage: null, birthday: null, joinedAt: "today",
} };
beforeEach(() => {
  runtime.states = []; runtime.cursor = 0; runtime.dirty = false;
  runtime.effect = undefined; runtime.cleanup = undefined; runtime.dependency = undefined;
  runtime.nextDependency = undefined; runtime.request.mockReset();
});
afterEach(() => runtime.cleanup?.());

describe("auth session loading lifecycle", () => {
  it("does not request while disabled, then exposes loading and the resolved session", async () => {
    const response = pending(); runtime.request.mockReturnValue(response.promise);
    expect(render(false)).toEqual({ ...guest, loading: false });
    expect(runtime.request).not.toHaveBeenCalled();
    expect(render(true)).toEqual({ ...guest, loading: true });
    expect(runtime.request).toHaveBeenCalledTimes(1);
    response.resolve(user); await response.promise;
    expect(render(true)).toEqual({ ...user, loading: false });
    expect(runtime.request).toHaveBeenCalledTimes(1);
    expect(render(false)).toEqual({ ...user, loading: false });
  });
  it("ignores a cancelled request after disable/re-enable", async () => {
    const old = pending(), current = pending();
    runtime.request.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    expect(render(true).loading).toBe(true);
    expect(render(false).loading).toBe(false);
    expect(render(true).loading).toBe(true);
    old.resolve(user); await old.promise;
    expect(render(true)).toEqual({ ...guest, loading: true });
    current.resolve(guest); await current.promise;
    expect(render(true)).toEqual({ ...guest, loading: false });
  });
  it("falls back to guest on errors and ignores completion after unmount", async () => {
    const failed = pending(); runtime.request.mockReturnValueOnce(failed.promise);
    render(true); failed.reject(new Error("offline")); await failed.promise.catch(() => {});
    expect(render(true)).toEqual({ ...guest, loading: false });
    render(false);
    const late = pending(); runtime.request.mockReturnValueOnce(late.promise);
    render(true); runtime.cleanup?.();
    const states = [...runtime.states]; late.resolve(user); await late.promise;
    expect(runtime.states).toEqual(states);
  });
});
