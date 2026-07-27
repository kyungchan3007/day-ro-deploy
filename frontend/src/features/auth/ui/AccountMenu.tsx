"use client";

import { useState } from "react";
import {
  SideMenu,
  MenuItem,
  LogoutButton,
  UserIcon,
  ConfirmDialog,
} from "@/shared/ui";
import { authStatic } from "@/shared/static/auth";
import { useLogout } from "../hooks/useLogout";
import { useAuthSession } from "../hooks/useAuthSession";
import {
  getSessionUserDisplayName,
  getSessionUserInitial,
} from "../lib/session-user";

/**
 * 계정 메뉴 (features/auth).
 *
 * 네비게이션 셸(shared/ui SideMenu)에 auth 도메인 내용을 주입한다.
 *   - 프로필(placeholder) + 내 정보 + 로그아웃.
 *   - 껍데기(드로어/열닫힘)는 SideMenu 가, 도메인 내용/로직은 이 슬라이스가 담당.
 *
 * 로그아웃은 확인 모달(공용 ConfirmDialog) → useLogout 훅으로 BFF 호출·라우팅을 위임한다.
 * 진행 상태/에러 문구만 이 컴포넌트가 렌더하고, 세션 로직은 훅/api 가 담당한다.
 */
export function AccountMenu() {
  const { menu } = authStatic;
  const { logout: logoutCopy } = menu;
  const { authenticated, user } = useAuthSession();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { logout, pending, error, reset } = useLogout();
  const profileName = authenticated
    ? getSessionUserDisplayName(user)
    : menu.profileName;
  const avatarInitial = authenticated
    ? getSessionUserInitial(user)
    : menu.avatarInitial;

  const closeConfirm = () => {
    setConfirmOpen(false);
    reset();
  };

  // 로그아웃은 드로어를 먼저 닫고 확인 모달을 띄운다.
  // (드로어·모달 백드롭이 겹쳐 이중으로 어두워지는 것을 막는다.)
  const openLogoutConfirm = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  return (
    <SideMenu
      open={menuOpen}
      onOpenChange={setMenuOpen}
      triggerLabel="메뉴"
      title="계정 메뉴"
    >
      <div className="flex items-center gap-3 px-1 pb-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-surface text-base font-bold text-primary">
          {avatarInitial}
        </span>
        <p className="text-base font-bold text-text-strong">{profileName}</p>
      </div>

      <div className="mb-2 h-px bg-border" />

      <nav aria-label="계정 메뉴 항목">
        <ul>
          {authenticated ? (
            <li>
              <MenuItem
                href="/mypage"
                icon={<UserIcon size={18} className="text-text-muted" />}
                label={menu.myInfo}
              />
            </li>
          ) : null}
        </ul>
      </nav>

      <div className="flex-1" />

      {authenticated ? (
        <LogoutButton onClick={openLogoutConfirm} />
      ) : (
        <MenuItem
          href="/login"
          icon={<UserIcon size={18} className="text-text-muted" />}
          label={menu.login}
        />
      )}

      {authenticated ? (
        <ConfirmDialog
          open={confirmOpen}
          onClose={closeConfirm}
          pending={pending}
          title={logoutCopy.title}
          body={
            error ? (
              <span className="text-danger">{logoutCopy.error}</span>
            ) : undefined
          }
          cancelLabel={logoutCopy.cancel}
          confirmLabel={pending ? logoutCopy.pending : logoutCopy.confirm}
          onConfirm={logout}
        />
      ) : null}
    </SideMenu>
  );
}
