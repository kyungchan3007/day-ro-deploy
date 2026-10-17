"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { GUEST_VISIT_CONFIG, runGuestVisitGuard } from "../model/guest-visit";

/** 사용 중 표시를 너무 자주 쓰지 않게 하는 간격. */
const TOUCH_THROTTLE_MS = 60 * 1000;

/**
 * 첫 로드 뒤의 "이번 방문" 판단 (issue #244). 판단 규칙은 `model/guest-visit`.
 * - 화면 이동 · 탭으로 돌아올 때: 30분 넘게 안 썼거나 24시간이 지났으면 새 방문 → 비회원 `/` 는 바로 시작 화면
 * - 화면을 만질 때(터치 · 키 · 스크롤, 1분 간격): 마지막 사용 시각 갱신
 *   scroll 은 버블링되지 않아(AppShell main 이 스크롤 영역) capture 로 받는다
 * 판단 결과는 `<html>` 속성으로만 반영돼 서버 화면을 다시 받을 필요가 없다.
 */
export function useGuestVisitTracker(): void {
  const pathname = usePathname();
  const lastTouch = useRef(0);

  useEffect(() => {
    runGuestVisitGuard(GUEST_VISIT_CONFIG);
  }, [pathname]);

  useEffect(() => {
    const check = () => {
      lastTouch.current = Date.now();
      runGuestVisitGuard(GUEST_VISIT_CONFIG);
    };
    const touch = () => {
      if (Date.now() - lastTouch.current >= TOUCH_THROTTLE_MS) check();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    const passiveCapture = { passive: true, capture: true } as const;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointerdown", touch, passiveCapture);
    window.addEventListener("keydown", touch, { capture: true });
    window.addEventListener("scroll", touch, passiveCapture);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointerdown", touch, passiveCapture);
      window.removeEventListener("keydown", touch, { capture: true });
      window.removeEventListener("scroll", touch, passiveCapture);
    };
  }, []);
}
