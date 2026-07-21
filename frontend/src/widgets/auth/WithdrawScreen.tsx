import { AppShell, NavBar } from "@/shared/ui";
import { WithdrawReasonForm } from "@/features/auth";
import { authStatic } from "@/shared/static/auth";

/**
 * 회원탈퇴 화면 (widgets/auth).
 *
 * 내정보처럼 AppShell 640 컬럼에 맞춘 일반 화면.
 *   - NavBar(뒤로 → /mypage + "회원탈퇴") + 사유 폼(features/auth).
 *   - 사유 선택/모달 흐름은 폼(client)이 담당. bleed 로 폼이 레이아웃(스크롤+하단 버튼)을 제어.
 */
export function WithdrawScreen() {
  const { navTitle } = authStatic.withdraw;

  return (
    <AppShell
      bleed
      nav={
        <NavBar
          backHref="/mypage"
          center={
            <span className="text-lg font-bold text-text-strong">
              {navTitle}
            </span>
          }
        />
      }
    >
      <WithdrawReasonForm />
    </AppShell>
  );
}
