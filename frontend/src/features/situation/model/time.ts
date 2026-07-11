import type { Time, TimeRange } from "./types";

export const pad2 = (n: number): string => String(n).padStart(2, "0");

/** "6:55" 형태(분만 2자리). meridiem 은 별도 표기. */
export const formatClock = (t: Time): string => `${t.hour}:${pad2(t.minute)}`;

/** 12시간제 → 자정 기준 분(0~1439). */
export function to24Minutes(t: Time): number {
  const h = t.hour % 12; // 12 → 0
  const base = t.meridiem === "오후" ? h + 12 : h;
  return base * 60 + t.minute;
}

/**
 * 데이트 길이(분).
 * 종료가 시작보다 이르거나 같으면 자정을 넘긴 것으로 보고 24시간을 더한다(익일).
 * 예: 오후 6시 → 오전 2시 = 8시간, 오전 12시 → 오전 4시 = 4시간.
 */
export function durationMinutes(range: TimeRange): number {
  const diff = to24Minutes(range.end) - to24Minutes(range.start);
  return diff <= 0 ? diff + 24 * 60 : diff;
}

/** 종료가 자정을 넘겨 다음날인지 여부. */
export function isOvernight(range: TimeRange): boolean {
  return to24Minutes(range.end) <= to24Minutes(range.start);
}

/** 분 → "8시간 30분" / "8시간" / "30분". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}
