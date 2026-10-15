import { LogoFull } from "@/shared/ui/logo";
import { onboardingStatic } from "@/shared/static/onboarding";
import { EmphasisText } from "./EmphasisText";
import styles from "./css/StartHero.module.css";

/**
 * start-hero : 시작 화면(비회원 첫 진입) 위쪽 소개 (features/onboarding, issue #230).
 * 로고 · 한 줄 소개 · 설명 · 키워드 칩. 로고는 시안의 임시 핀 대신 공식 로고를 쓴다.
 */
export function StartHero() {
  const { headline, sub, keywords } = onboardingStatic.start;

  return (
    <section className={styles.hero} aria-labelledby="start-headline">
      <LogoFull width={150} priority className={styles.logo} />
      <h1 id="start-headline" className={`${styles.headline} whitespace-pre-line`}>
        <EmphasisText segments={headline} />
      </h1>
      <p className={`${styles.sub} whitespace-pre-line`}>{sub}</p>
      <ul className={styles.keywords} aria-label="입력하는 세 가지">
        {keywords.map((keyword) => (
          <li key={keyword}>{keyword}</li>
        ))}
      </ul>
    </section>
  );
}
