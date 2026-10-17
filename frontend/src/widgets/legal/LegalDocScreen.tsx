import { AppShell, NavTitle } from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import type { LegalDoc } from "@/shared/static/legal";
import styles from "./css/LegalDocScreen.module.css";

export interface LegalDocScreenProps {
  doc: LegalDoc;
}

/**
 * 법적 고지 문서 화면 (widgets/legal).
 *
 * 이용약관·개인정보처리방침처럼 "제목 + 조항 나열" 형태의 정적 문서를 공통으로 렌더한다.
 *   - NavBar(뒤로가기 → 홈) + 상단 임시 문구 고지 + 조항 섹션 목록.
 *   - 본문은 shared/static/legal 의 임시 문구. server component 로 SSR/SSG 렌더.
 */
export function LegalDocScreen({ doc }: LegalDocScreenProps) {
  const { title, notice, updatedAt, sections } = doc;

  return (
    <AppShell
      nav={
        <AccountNavBar
          backHref="/"
          center={
            <NavTitle>{title}</NavTitle>
          }
        />
      }
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className="text-title-lg leading-7 font-bold text-text-strong">{title}</h1>
          <p className="text-meta leading-4 text-text-disabled">최종 업데이트 {updatedAt}</p>
          <p className={`${styles.notice} text-label leading-relaxed text-text-muted`}>
            {notice}
          </p>
        </header>

        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.heading} className={styles.section}>
              <h2 className="text-body font-bold text-text-strong">
                {section.heading}
              </h2>
              <p className="text-control leading-relaxed text-text-secondary">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
