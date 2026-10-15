import { AppShell, SiteFooter } from "@/shared/ui/layout";
import { KakaoLoginButton } from "@/features/auth";
import { GuestBrowseLink, StartHero } from "@/features/onboarding";
import { onboardingStatic } from "@/shared/static/onboarding";
import { siteStatic } from "@/shared/static/site";
import styles from "./css/StartScreen.module.css";

/**
 * 시작 화면 (widgets/onboarding, issue #230 · QA #25).
 *
 * 비회원이 `/` 에 처음 들어오면 홈 대신 보인다(회원 · 이번 방문에 둘러보기를 고른 비회원은 홈).
 *   - 소개(StartHero) + 카카오 로그인 + 로그인 전 둘러보기(→ 온보딩) + 홈과 같은 푸터
 *   - 카카오 로그인은 로그인 화면과 같은 시작 경로를 쓴다(next 없음 → 로그인 후 `/` = 홈)
 *   - server component 로 SSR 렌더
 */
export function StartScreen() {
  return (
    <AppShell bleed className={styles.screen} footer={<SiteFooter {...siteStatic.footer} />}>
      <StartHero />
      <div className={styles.actions}>
        <form action="/api/auth/kakao/start" method="get">
          <KakaoLoginButton label={onboardingStatic.start.kakaoLabel} size="lg" type="submit" />
        </form>
        <GuestBrowseLink />
      </div>
    </AppShell>
  );
}
