import { AppShell, NavBar } from "@/shared/ui";
import { FaqAccordion } from "@/features/faq";
import { faqStatic } from "@/shared/static/faq";

/**
 * FAQ 화면 (widgets/faq).
 *
 * 시안(데이로라_홈)의 FAQ 페이지를 라우트 화면으로 옮긴 조합 아티팩트.
 *   - NavBar(뒤로가기 → 홈) + 섹션 타이틀 + 아코디언(features/faq).
 *   - 정적 문구는 shared/static/faq. 화면 골격은 server, 아코디언만 client.
 */
export function FaqScreen() {
  const { title, sectionTitle, items } = faqStatic;

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
    >
      <div className="flex flex-col gap-2 py-6">
        <h1 className="text-[17px] font-bold text-text-strong">
          {sectionTitle}
        </h1>
        <FaqAccordion items={items} />
      </div>
    </AppShell>
  );
}
