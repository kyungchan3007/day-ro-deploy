"use client";

import { LogoutButton } from "@/shared/ui/auth";
import { ConfirmDialog } from "@/shared/ui/dialog";
import { BookmarkIcon, UserIcon } from "@/shared/ui/icon";
import { SideMenu } from "@/shared/ui/layout";
import { MenuItem } from "@/shared/ui/menu";
import { useAccountMenu } from "../hooks/useAccountMenu";
import styles from "./css/AccountMenu.module.css";

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
  const {
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
    profileName,
    avatarInitial,
  } = useAccountMenu();
  const { logout: logoutCopy } = menu;

  return (
    <SideMenu
      open={menuOpen}
      onOpenChange={setMenuOpen}
      triggerLabel="메뉴"
      title="계정 메뉴"
    >
      <div className={styles.profileRow}>
        <span
          className={`${styles.avatar} size-12 rounded-full bg-primary-surface text-base font-bold text-primary`}
        >
          {avatarInitial}
        </span>
        <p className="text-base font-bold text-text-strong">{profileName}</p>
      </div>

      <div className={styles.divider} />

      <nav aria-label="계정 메뉴 항목">
        <ul>
          {loading ? (
            <li className="px-3 py-2 text-sm text-text-muted">계정 정보를 불러오는 중…</li>
          ) : authenticated ? (
            <>
              <li>
                <MenuItem
                  href="/saved"
                  icon={<BookmarkIcon size={18} className="text-text-muted" />}
                  label={menu.savedCourses}
                />
              </li>
              <li>
                <MenuItem
                  href="/mypage"
                  icon={<UserIcon size={18} className="text-text-muted" />}
                  label={menu.myInfo}
                />
              </li>
            </>
          ) : null}
        </ul>
      </nav>

      <div className={styles.spacer} />

      {loading ? null : authenticated ? (
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
              <span className={styles.errorText}>{logoutCopy.error}</span>
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
