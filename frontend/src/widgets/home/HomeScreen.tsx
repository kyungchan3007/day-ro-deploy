import { AppShell, SiteFooter } from "@/shared/ui/layout";
import { HomeEntryCard } from "@/features/home";
import { AccountNavBar } from "@/features/auth";
import { homeStatic } from "@/shared/static/home";
import { siteStatic } from "@/shared/static/site";
import imgCreate from "./assets/img-create.webp";
import imgSaved from "./assets/img-saved.webp";
import { WebVitalsLogger } from "@/shared/observability";
import styles from "./css/HomeScreen.module.css";

/**
 * 홈(루트) 화면 (widgets/home).
 *
 * 여러 조각을 하나의 진입 화면으로 조합한다.
 *   - 헤더(NavBar, 뒤로가기 없음) + 보라 그라데이션 본문 + 공용 푸터(`SiteFooter`, 로고 + 정책 링크 + 저작권).
 *   - 본문 중앙에 진입 카드 2개(features/home).
 *   - 정적 문구는 shared/static/home, 일러스트는 위젯 에셋을 카드에 주입.
 *   - server component 로 SSR 렌더.
 */
export interface HomeScreenProps {
  /**
   * 첫 카드 그림을 우선 로드할지. 기본 true(회원 홈 · LCP).
   * 비회원 `/` 는 시작 화면과 함께 숨긴 채 내려오므로 false → 지연 로드(숨은 동안 받지 않음, issue #244).
   */
  imagePriority?: boolean;
}

export function HomeScreen({ imagePriority = true }: HomeScreenProps = {}) {
  const { create, saved } = homeStatic.cards;

  return (
    <AppShell
      bleed
      nav={<AccountNavBar showBack={false} />}
      footer={<SiteFooter {...siteStatic.footer} />}
      className={styles.screen}
    >
      {process.env.NODE_ENV === "development" ? (
        <WebVitalsLogger route="home" />
      ) : null}
      <h1 className="sr-only">Dayro 홈</h1>
      <section aria-labelledby="home-entry-heading" className={`w-full ${styles.entrySection}`}>
        <h2 id="home-entry-heading" className="sr-only">
          주요 서비스 진입
        </h2>
        <ul className={styles.entryList}>
          <li>
            <HomeEntryCard
              image={imgCreate}
              imagePriority={imagePriority}
              title={create.title}
              subtitle={create.subtitle}
              href={create.href}
            />
          </li>
          <li>
            <HomeEntryCard
              image={imgSaved}
              title={saved.title}
              subtitle={saved.subtitle}
              href={saved.href}
            />
          </li>
        </ul>
      </section>
    </AppShell>
  );
}
