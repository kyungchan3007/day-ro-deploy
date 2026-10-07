import { AppShell, WithdrawButton } from "@/shared/ui";
import { buildProfileInfoRows, ProfileInfoList } from "@/features/profile";
import { profileStatic } from "@/shared/static/profile";
import {
  AccountNavBar,
  getSessionUserDisplayName,
  getSessionUserInitial,
  type SessionUser,
} from "@/features/auth";
import styles from "./css/MyInfoScreen.module.css";

export interface MyInfoScreenProps {
  user: SessionUser;
}

/**
 * 내 정보 화면 (widgets/profile).
 *
 * 시안은 풀스크린이지만, 여기서는 표준 골격 AppShell 을 써 640 컬럼에 맞춘 일반 화면으로 만든다.
 * (햄버거 드로어처럼 프레임 예외가 아니다)
 *   - NavBar(뒤로가기 backHref + 타이틀) + 프로필 + 정보 리스트 + 하단 회원탈퇴.
 *   - 프로필 데이터는 보호 라우트에서 서버가 조회한 현재 사용자 정보를 그대로 렌더한다.
 */
export function MyInfoScreen({ user }: MyInfoScreenProps) {
  const { title, withdrawLabel } = profileStatic.myInfo;
  const profileName = getSessionUserDisplayName(user);
  const avatarInitial = getSessionUserInitial(user);
  const rows = buildProfileInfoRows(user);

  return (
    <AppShell
      nav={
        <AccountNavBar
          backHref="/"
          center={
            <span className={styles.navTitle}>{title}</span>
          }
        />
      }
      footer={
        <div className={styles.footer}>
          <WithdrawButton label={withdrawLabel} href="/mypage/withdraw" />
        </div>
      }
    >
      <div className={styles.profile}>
        <span
          className={`${styles.avatar} size-16 rounded-full bg-primary-surface text-[22px] font-bold text-primary`}
        >
          {avatarInitial}
        </span>
        <p className="text-[17px] font-bold text-text-strong">{profileName}</p>
      </div>

      <ProfileInfoList rows={rows} />
    </AppShell>
  );
}
