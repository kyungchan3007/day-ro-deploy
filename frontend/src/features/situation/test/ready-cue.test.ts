import { describe, expect, it, vi } from "vitest";

import { READY_HAPTIC_MS, isReadyTransition, playReadyHaptic } from "../model/ready-cue";

/** issue #203 (QA #22): 코스 생성 완료 순간 CTA 진동. */
describe("isReadyTransition", () => {
  it("생성 중 → 완료로 바뀐 순간만 true", () => {
    expect(isReadyTransition(false, true)).toBe(true);
    expect(isReadyTransition(true, true)).toBe(false);
    expect(isReadyTransition(false, false)).toBe(false);
    expect(isReadyTransition(true, false)).toBe(false);
  });
});

describe("playReadyHaptic", () => {
  it("보이는 탭이면 짧게 한 번 진동을 요청한다", () => {
    const vibrate = vi.fn(() => true);
    expect(playReadyHaptic({ vibrate, visibilityState: "visible" })).toBe(true);
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(READY_HAPTIC_MS);
  });

  it("다른 탭을 보고 있으면 진동하지 않는다", () => {
    const vibrate = vi.fn(() => true);
    expect(playReadyHaptic({ vibrate, visibilityState: "hidden" })).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("진동 미지원 기기(iOS Safari 등)는 조용히 넘어간다", () => {
    expect(playReadyHaptic({ vibrate: undefined, visibilityState: "visible" })).toBe(false);
  });

  it("브라우저가 진동 요청에서 예외를 던져도 화면 흐름을 막지 않는다", () => {
    const vibrate = vi.fn(() => {
      throw new Error("blocked");
    });
    expect(playReadyHaptic({ vibrate, visibilityState: "visible" })).toBe(false);
  });
});
