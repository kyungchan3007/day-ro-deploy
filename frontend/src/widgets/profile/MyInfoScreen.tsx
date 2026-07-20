import { AppShell, NavBar, WithdrawButton } from "@/shared/ui";
import { ProfileInfoList } from "@/features/profile";
import { profileStatic } from "@/shared/static/profile";
import { authStatic } from "@/shared/static/auth";

/**
 * 내 정보 화면 (widgets/profile).
 *
 * 시안은 풀스크린이지만, 여기서는 표준 골격 AppShell 을 써 640 컬럼에 맞춘 일반 화면으로 만든다.
 * (햄버거 드로어처럼 프레임 예외가 아니다)
 *   - NavBar(뒤로가기 backHref + 타이틀) + 프로필 + 정보 리스트 + 하단 회원탈퇴.
 *   - 프로필 데이터는 로그인 연동 전까지 placeholder. server component 로 SSR 렌더.
 */
export function MyInfoScreen() {
  const { title, rows, withdrawLabel } = profileStatic.myInfo;
  const { profileName, avatarInitial } = authStatic.menu;

  return (
    <AppShell
      nav={
        <NavBar
          backHref="/"
          center={
            <span className="text-lg font-bold text-text-strong">{title}</span>
          }
        />
      }
      footer={
        <div className="flex justify-center px-5 pb-6 pt-2">
          <WithdrawButton label={withdrawLabel} />
        </div>
      }
    >
      <div className="flex flex-col items-center gap-2 py-8">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary-surface text-[22px] font-bold text-primary">
          {avatarInitial}
        </span>
        <p className="text-[17px] font-bold text-text-strong">{profileName}</p>
      </div>

      <ProfileInfoList rows={rows} />
    </AppShell>
  );
}
