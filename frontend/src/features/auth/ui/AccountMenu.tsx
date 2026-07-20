"use client";

import { SideMenu, MenuItem, LogoutButton, UserIcon } from "@/shared/ui";
import { authStatic } from "@/shared/static/auth";

/**
 * 계정 메뉴 (features/auth).
 *
 * 네비게이션 셸(shared/ui SideMenu)에 auth 도메인 내용을 주입한다.
 *   - 프로필(placeholder) + 내 정보 + 로그아웃.
 *   - 껍데기(드로어/열닫힘)는 SideMenu 가, 도메인 내용/로직은 이 슬라이스가 담당.
 *
 * NOTE: 지금은 항목 클릭이 placeholder 다(UI/UX 전용).
 * 추후 로그아웃/회원탈퇴 등 실제 세션 로직이 features/auth(model/hooks 등)로 들어온다.
 */
export function AccountMenu() {
  const { menu } = authStatic;

  return (
    <SideMenu triggerLabel="메뉴" title="계정 메뉴">
      <div className="flex items-center gap-3 px-1 pb-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-surface text-base font-bold text-primary">
          {menu.avatarInitial}
        </span>
        <p className="text-base font-bold text-text-strong">{menu.profileName}</p>
      </div>

      <div className="mb-2 h-px bg-border" />

      <MenuItem
        href="/mypage"
        icon={<UserIcon size={18} className="text-text-muted" />}
        label={menu.myInfo}
      />

      <div className="flex-1" />

      <LogoutButton
        onClick={() => {
          /* TODO: 로그아웃(세션 로직) */
        }}
      />
    </SideMenu>
  );
}
