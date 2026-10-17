"use client";

import { useGuestVisitTracker } from "../hooks/useGuestVisitTracker";

/**
 * 첫 로드 뒤의 "이번 방문" 판단을 붙이는 자리 (issue #244). 루트 레이아웃에 한 번 둔다(화면 없음).
 * 동작은 `hooks/useGuestVisitTracker`.
 */
export function GuestVisitTracker() {
  useGuestVisitTracker();
  return null;
}
