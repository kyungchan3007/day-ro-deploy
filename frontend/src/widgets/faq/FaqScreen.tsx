import Link from "next/link";

import { AppShell } from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import { FaqSearchableList } from "@/features/faq";
import { faqStatic } from "@/shared/static/faq";
import styles from "./css/FaqScreen.module.css";

/**
 * FAQ 화면 (widgets/faq).
 *
 * 시안(데이로라_홈)의 FAQ 페이지를 라우트 화면으로 옮긴 조합 아티팩트.
 *   - NavBar(뒤로가기 → 홈) + 섹션 타이틀 + 아코디언(features/faq).
 *   - 정적 문구는 shared/static/faq. 화면 골격은 server, 아코디언만 client.
 */
export function FaqScreen() {
  const { title, sectionTitle, items, footer } = faqStatic;

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
        <div className={styles.faqBottom}>
          <p className={styles.faqBottomText}>{footer.text}</p>
          <Link href="/faq/contact" className={styles.contactButton}>
            {footer.contactLabel}
          </Link>
        </div>
      }
    >
      <div className={styles.content}>
        <h1 className={styles.heading}>{sectionTitle}</h1>
        <FaqSearchableList items={items} />
      </div>
    </AppShell>
  );
}
