/**
 * 온보딩 장 이동 규칙 (issue #230).
 * 첫 장에서 "이전" → 시작 화면, 마지막 장에서 "다음(시작하기)" → 홈.
 */

export type OnboardingMove =
  | { type: "slide"; index: number }
  | { type: "start" }
  | { type: "finish" };

export function moveNext(index: number, total: number): OnboardingMove {
  return index < total - 1 ? { type: "slide", index: index + 1 } : { type: "finish" };
}

export function movePrev(index: number): OnboardingMove {
  return index > 0 ? { type: "slide", index: index - 1 } : { type: "start" };
}

/** 스와이프 판정 최소 거리(px). 시안 기준 50px. */
export const SWIPE_THRESHOLD_PX = 50;

/**
 * 스와이프로 옮길 장. 장 끝에서는 넘어가지 않는다(시작 화면 · 홈 이동은 버튼으로만).
 * 세로 이동이 더 큰 손짓(내용 스크롤)은 장을 넘기지 않는다.
 * @param deltaX 손가락 끝 x - 시작 x (왼쪽으로 밀면 음수)
 * @param deltaY 손가락 끝 y - 시작 y
 */
export function swipeTarget(index: number, total: number, deltaX: number, deltaY = 0): number {
  if (Math.abs(deltaY) >= Math.abs(deltaX)) return index;
  if (deltaX <= -SWIPE_THRESHOLD_PX && index < total - 1) return index + 1;
  if (deltaX >= SWIPE_THRESHOLD_PX && index > 0) return index - 1;
  return index;
}

/**
 * 키보드(좌우 화살표)로 옮길 장(issue #229). 장 끝에서는 넘어가지 않는다 — 스와이프와 같은 규칙.
 * @param delta 다음 장 +1 · 이전 장 -1
 */
export function stepBy(index: number, total: number, delta: number): number {
  const target = index + delta;
  return target >= 0 && target < total ? target : index;
}

export function isLastSlide(index: number, total: number): boolean {
  return index === total - 1;
}
