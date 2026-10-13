import { AppShell } from "@/shared/ui";
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
            <span className={styles.navTitle}>{title}</span>
          }
        />
      }
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className="text-xl font-bold text-text-strong">{title}</h1>
          <p className="text-xs text-text-disabled">최종 업데이트 {updatedAt}</p>
          <p className={`${styles.notice} text-[13px] leading-relaxed text-text-muted`}>
            {notice}
          </p>
        </header>

        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.heading} className={styles.section}>
              <h2 className="text-[15px] font-bold text-text-strong">
                {section.heading}
              </h2>
              <p className="text-sm leading-relaxed text-text-secondary">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
