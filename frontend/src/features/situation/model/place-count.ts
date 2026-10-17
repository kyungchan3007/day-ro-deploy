/**
 * 코스 장소 수 (QA #9 · issue #247, 시안 `dayro_prototype (13)` 시간 화면).
 * 2~5곳 · 기본 3곳. 지금은 흐름 상태에만 저장하고 코스 생성 요청에는 보내지 않는다
 * (요청 계약에 필드가 없음 — 백엔드 추가 후 zod 계약부터 연동).
 */
export const PLACE_COUNT_MIN = 2;
export const PLACE_COUNT_MAX = 5;
export const PLACE_COUNT_DEFAULT = 3;

/**
 * 저장된 값을 화면에 쓸 값으로 맞춘다. 없거나 정수가 아니면 기본값, 범위 밖이면 가장 가까운 끝.
 * @param value 흐름 상태에 저장된 값(예전 스냅샷이면 없음).
 */
export function resolvePlaceCount(value: number | undefined): number {
  if (value == null || !Number.isInteger(value)) return PLACE_COUNT_DEFAULT;
  return Math.min(PLACE_COUNT_MAX, Math.max(PLACE_COUNT_MIN, value));
}

/**
 * 한 칸 줄이거나 늘린 값. 끝에서는 그대로.
 * @param current 지금 값.
 * @param delta -1(줄이기) 또는 +1(늘리기).
 */
export function stepPlaceCount(current: number, delta: number): number {
  return resolvePlaceCount(current + delta);
}
