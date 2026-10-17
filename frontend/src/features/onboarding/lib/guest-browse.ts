import { GUEST_VISIT_ATTRIBUTE, GUEST_VISIT_STORAGE_KEY } from "@/shared/lib/guest-visit-marker";

import { buildGuestVisitMarker } from "../model/guest-visit";

/**
 * 이번 탭에서 비회원 둘러보기를 골랐다고 기록한다(브라우저 전용, issue #230 · #244).
 * 탭 표시(sessionStorage · 탭을 닫으면 사라짐)를 남기고 `<html>` 속성을 바로 켜 홈을 보여준다.
 */
export function markGuestBrowse(): void {
  document.documentElement.setAttribute(GUEST_VISIT_ATTRIBUTE, "on");
  try {
    window.sessionStorage.setItem(GUEST_VISIT_STORAGE_KEY, buildGuestVisitMarker(Date.now()));
  } catch {
    // 저장소가 막힌 환경: 이 화면에서만 홈을 보여주고, 새로 불러오면 다시 시작 화면.
  }
}
