"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GUEST_VISIT_ENDED_EVENT } from "@/shared/lib/guest-visit-marker";
import { authStatic } from "@/shared/static/auth";
import { useAuthSession } from "./useAuthSession";
import { useLogout } from "./useLogout";
import { buildMenuLoginPath, resolveLoginReturnPath } from "../model/menu-login";
import {
  getSessionUserDisplayName,
  getSessionUserInitial,
} from "../lib/session-user";

/**
 * 계정 메뉴 상태/전이 훅.
 *
 * 드로어 열림 상태, 로그아웃 확인 모달 전이, 세션 표시용 파생값을 UI 밖으로 분리한다.
 * 로그인은 현재 화면을 next 로 넘겨 이동한다(QA #21, issue #181).
 */
export function useAccountMenu({ onBeforeLogin }: { onBeforeLogin?: () => void } = {}) {
  const { menu } = authStatic;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sessionEnabled = menuOpen || confirmOpen;
  const { authenticated, user, loading } = useAuthSession({
    enabled: sessionEnabled,
  });
  const { logout, pending, error, reset } = useLogout();
  const router = useRouter();

  // 비회원 홈이 숨겨질 때(둘러보기 방문 종료, issue #244) 열린 메뉴 · 확인창을 닫는다 — body 포털이라 CSS 로 함께 숨지 않는다.
  useEffect(() => {
    const close = () => {
      setMenuOpen(false);
      setConfirmOpen(false);
    };
    window.addEventListener(GUEST_VISIT_ENDED_EVENT, close);
    return () => window.removeEventListener(GUEST_VISIT_ENDED_EVENT, close);
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    reset();
  }, [reset]);

  const openLogoutConfirm = useCallback(() => {
    setMenuOpen(false);
    setConfirmOpen(true);
  }, []);

  /**
   * 메뉴 "로그인": 화면 상태를 맡길 기회를 준 뒤, 현재 화면을 next 로 넘겨 로그인으로 이동.
   * 링크(`/login`) 기본 이동은 막고 next 를 붙인 주소로 직접 이동한다.
   */
  const goLogin = useCallback((event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    onBeforeLogin?.();
    setMenuOpen(false);
    // 쿼리(step · rev 등)까지 넘기기 위해 클릭 시점의 주소를 읽는다(정적 화면에서 useSearchParams 회피).
    router.push(buildMenuLoginPath(window.location.pathname, window.location.search));
  }, [onBeforeLogin, router]);

  /**
   * 로그아웃 확정: 떠나기 전에 화면 상태를 맡기고, 다시 로그인하면 지금 화면으로 돌아오도록
   * 현재 경로를 넘긴다(issue #181 — 바뀌면 안 되는 규칙). 로그아웃 뒤 도착 화면은 시작 화면(issue #244).
   */
  const logoutAndReturn = useCallback(async () => {
    onBeforeLogin?.();
    await logout(resolveLoginReturnPath(window.location.pathname, window.location.search));
  }, [logout, onBeforeLogin]);

  return {
    menu,
    goLogin,
    authenticated,
    loading,
    menuOpen,
    confirmOpen,
    pending,
    error,
    setMenuOpen,
    closeConfirm,
    openLogoutConfirm,
    logout: logoutAndReturn,
    profileName: authenticated
      ? getSessionUserDisplayName(user)
      : menu.profileName,
    avatarInitial: authenticated
      ? getSessionUserInitial(user)
      : menu.avatarInitial,
  };
}
