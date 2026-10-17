import {
  GUEST_VISIT_ATTRIBUTE,
  GUEST_VISIT_ENDED_EVENT,
  GUEST_VISIT_STORAGE_KEY,
} from "@/shared/lib/guest-visit-marker";

import { GUEST_BROWSE_MAX_AGE_SECONDS } from "./root-entry";

/**
 * 비회원 "이번 방문" 판단 (issue #244).
 *
 * 사용자 결정(2026-10-16 · 17)
 * - 게스트가 사이트를 닫았다 다시 들어오면 → 다시 시작 화면 · 온보딩
 * - 닫지 않고 계속 쓰는 동안은 최대 24시간 홈 유지
 * - 30분 넘게 안 쓰다 돌아오면(탭 복원 · 모바일 백그라운드 포함) → 새 방문
 * - 사이트를 열어둔 채 새 탭으로 들어오면 새 탭은 새 방문, 열어둔 기존 탭은 홈 유지
 *
 * 구조 — 탭마다 따로 판단해야 해서 서버 쿠키(모든 탭 공유)를 쓰지 않는다
 * - 탭 표시(sessionStorage `{ startedAt, lastActiveAt }`): 탭을 닫으면 사라짐
 * - 판단 결과를 `<html data-guest-visit="on">` 으로 건다 → 비회원 `/` 에 함께 내려온 홈 · 시작 화면 중 CSS 가 하나를 보여줌
 * - 판단 함수 `runGuestVisitGuard` 하나를 `<head>` 인라인 스크립트(첫 로드 · 그리기 전)와
 *   클라이언트 tracker(화면 이동 · 탭 복귀 · 사용 중)가 함께 쓴다
 */

/** 이만큼 안 쓰다 돌아오면 새 방문으로 본다. */
export const GUEST_VISIT_IDLE_MS = 30 * 60 * 1000;

export interface GuestVisitConfig {
  storageKey: string;
  attribute: string;
  endedEvent: string;
  maxAgeMs: number;
  idleMs: number;
}

export const GUEST_VISIT_CONFIG: GuestVisitConfig = {
  storageKey: GUEST_VISIT_STORAGE_KEY,
  attribute: GUEST_VISIT_ATTRIBUTE,
  endedEvent: GUEST_VISIT_ENDED_EVENT,
  maxAgeMs: GUEST_BROWSE_MAX_AGE_SECONDS * 1000,
  idleMs: GUEST_VISIT_IDLE_MS,
};

/** 이번 탭이 둘러보기 중인지. 저장소 접근이 막혔으면 null(판단 안 함 → 시작 화면). */
export type GuestVisitState = "on" | "off" | null;

/**
 * 이번 탭 표시를 읽어 판단하고, 결과를 `<html>` 속성에 건다.
 * - 둘러보기 중(30분 안에 썼고 24시간 안): 마지막 사용 시각 갱신 · 속성 "on"
 * - 그 밖(표시 없음 · 깨짐 · 오래됨): 표시 삭제 · 속성 제거 → 시작 화면
 *   (둘러보기 중이던 탭이면 `cfg.endedEvent` 를 보내 숨겨지는 홈의 열린 메뉴를 닫게 한다)
 * 인라인 스크립트로도 쓰므로(`Function.prototype.toString`) 바깥 변수 · import 없이 자기완결로 쓴다(전역 window · document · JSON · Event 만 사용).
 * @param cfg 저장소 · 속성 이름과 시간 기준.
 */
export function runGuestVisitGuard(cfg: GuestVisitConfig): GuestVisitState {
  try {
    const now = Date.now();
    const raw = window.sessionStorage.getItem(cfg.storageKey);
    let visit: { startedAt: number; lastActiveAt: number } | null = null;
    try {
      visit = raw ? JSON.parse(raw) : null;
    } catch {
      visit = null;
    }
    const active =
      !!visit &&
      typeof visit.startedAt === "number" &&
      typeof visit.lastActiveAt === "number" &&
      now - visit.lastActiveAt <= cfg.idleMs &&
      now - visit.startedAt <= cfg.maxAgeMs;
    if (active) {
      window.sessionStorage.setItem(cfg.storageKey, JSON.stringify({ startedAt: visit!.startedAt, lastActiveAt: now }));
      document.documentElement.setAttribute(cfg.attribute, "on");
      return "on";
    }
    if (raw !== null) window.sessionStorage.removeItem(cfg.storageKey);
    const wasOn = document.documentElement.getAttribute(cfg.attribute) === "on";
    document.documentElement.removeAttribute(cfg.attribute);
    if (wasOn) window.dispatchEvent(new Event(cfg.endedEvent));
    return "off";
  } catch {
    return null;
  }
}

/** 둘러보기를 고른 순간의 탭 표시 값. */
export function buildGuestVisitMarker(now: number): string {
  return JSON.stringify({ startedAt: now, lastActiveAt: now });
}

/** 루트 레이아웃 `<head>` 인라인 스크립트 — 첫 로드에서 화면을 그리기 전에 판단해 깜빡임 없이 맞는 화면을 보여준다. */
export function buildGuestVisitGuardScript(): string {
  return "(" + runGuestVisitGuard.toString() + ")(" + JSON.stringify(GUEST_VISIT_CONFIG) + ");";
}
