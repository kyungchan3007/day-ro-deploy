"use client";

import { useCallback, useState } from "react";
import { authStatic } from "@/shared/static/auth";
import { useAuthSession } from "./useAuthSession";
import { useLogout } from "./useLogout";
import {
  getSessionUserDisplayName,
  getSessionUserInitial,
} from "../lib/session-user";

/**
 * 계정 메뉴 상태/전이 훅.
 *
 * 드로어 열림 상태, 로그아웃 확인 모달 전이, 세션 표시용 파생값을 UI 밖으로 분리한다.
 */
export function useAccountMenu() {
  const { menu } = authStatic;
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const sessionEnabled = menuOpen || confirmOpen;
  const { authenticated, user, loading } = useAuthSession({
    enabled: sessionEnabled,
  });
  const { logout, pending, error, reset } = useLogout();

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false);
    reset();
  }, [reset]);

  const openLogoutConfirm = useCallback(() => {
    setMenuOpen(false);
    setConfirmOpen(true);
  }, []);

  return {
    menu,
    authenticated,
    loading,
    menuOpen,
    confirmOpen,
    pending,
    error,
    setMenuOpen,
    closeConfirm,
    openLogoutConfirm,
    logout,
    profileName: authenticated
      ? getSessionUserDisplayName(user)
      : menu.profileName,
    avatarInitial: authenticated
      ? getSessionUserInitial(user)
      : menu.avatarInitial,
  };
}
