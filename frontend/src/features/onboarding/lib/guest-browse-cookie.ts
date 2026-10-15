import { buildGuestBrowseCookie } from "../model/root-entry";

/** 이번 방문에서 비회원 둘러보기를 골랐다고 기록한다(브라우저 전용). */
export function markGuestBrowse(): void {
  document.cookie = buildGuestBrowseCookie(window.location.protocol === "https:");
}
