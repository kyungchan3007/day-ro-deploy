import { NavBar, type NavBarProps } from "@/shared/ui/layout";
import { AccountMenu } from "./AccountMenu";

export interface AccountNavBarProps extends NavBarProps {
  /** 메뉴 "로그인"으로 떠나기 직전 호출(화면 상태 인계용, issue #181). */
  onBeforeLogin?: () => void;
}

/**
 * 계정 메뉴가 결합된 상단 네비게이션 조합.
 * 각 화면의 뒤로가기/타이틀 계약은 그대로 받고, 우측에 햄버거 메뉴를 기본으로 붙인다.
 */
export function AccountNavBar({ onBeforeLogin, ...props }: AccountNavBarProps) {
  return <NavBar {...props} right={<AccountMenu onBeforeLogin={onBeforeLogin} />} />;
}
