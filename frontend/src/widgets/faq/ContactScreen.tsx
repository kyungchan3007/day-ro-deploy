import { AppShell } from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import { ContactForm } from "@/features/faq";
import { faqStatic } from "@/shared/static/faq";
import styles from "./css/FaqScreen.module.css";

/**
 * 문의하기 화면 (widgets/faq).
 *
 * FAQ 하단 "문의하기"로 진입하는 폼 페이지.
 *   - NavBar(뒤로 → /faq + "문의하기") + 문의 폼(features/faq).
 *   - bleed 로 폼이 레이아웃(스크롤 본문 + 하단 제출 버튼)을 직접 제어한다.
 *   - 검증/모달 흐름은 폼(client)이 담당. 실제 전송 API 는 아직 없다.
 */
export function ContactScreen() {
  const { navTitle } = faqStatic.contact;

  return (
    <AppShell
      bleed
      nav={
        <AccountNavBar
          backHref="/faq"
          center={<span className={styles.navTitle}>{navTitle}</span>}
        />
      }
    >
      <ContactForm />
    </AppShell>
  );
}
