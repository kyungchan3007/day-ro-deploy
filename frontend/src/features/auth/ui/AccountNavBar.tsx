import { NavBar, type NavBarProps } from "@/shared/ui/layout";
import { AccountMenu } from "./AccountMenu";

/**
 * 계정 메뉴가 결합된 상단 네비게이션 조합.
 * 각 화면의 뒤로가기/타이틀 계약은 그대로 받고, 우측에 햄버거 메뉴를 기본으로 붙인다.
 */
export function AccountNavBar(props: NavBarProps) {
  return <NavBar {...props} right={<AccountMenu />} />;
}
