/** 코스 생성 완료 순간 진동 길이(ms). "톡" 한 번 정도로 짧게 (issue #203). */
export const READY_HAPTIC_MS = 40;

export interface ReadyHapticEnv {
  /** `navigator.vibrate`. 미지원 브라우저(iOS Safari 등)는 undefined. */
  vibrate?: (pattern: number) => boolean;
  /** `document.visibilityState`. */
  visibilityState?: DocumentVisibilityState;
}

/** 생성 중 → 완료로 바뀐 순간인지. 처음부터 완료 상태였거나 그대로면 false. */
export function isReadyTransition(prev: boolean, next: boolean): boolean {
  return !prev && next;
}

/**
 * 완료 순간 짧은 진동 (QA #22, issue #203).
 * 다른 탭을 보고 있거나 진동을 지원하지 않으면 조용히 넘어간다.
 * @returns 진동을 요청했으면 브라우저 응답, 건너뛰었으면 false.
 */
export function playReadyHaptic(env: ReadyHapticEnv): boolean {
  if (env.visibilityState === "hidden" || typeof env.vibrate !== "function") {
    return false;
  }
  try {
    return env.vibrate(READY_HAPTIC_MS);
  } catch {
    return false;
  }
}
