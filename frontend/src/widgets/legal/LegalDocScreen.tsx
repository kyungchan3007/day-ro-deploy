import { AppShell, NavBar } from "@/shared/ui";
import type { LegalDoc } from "@/shared/static/legal";

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
        <NavBar
          backHref="/"
          center={
            <span className="text-lg font-bold text-text-strong">{title}</span>
          }
        />
      }
    >
      <div className="flex flex-col gap-6 py-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-text-strong">{title}</h1>
          <p className="text-xs text-text-disabled">최종 업데이트 {updatedAt}</p>
          <p className="rounded-md bg-surface-subtle px-3 py-2 text-[13px] leading-relaxed text-text-muted">
            {notice}
          </p>
        </header>

        <div className="flex flex-col gap-5">
          {sections.map((section) => (
            <section key={section.heading} className="flex flex-col gap-1.5">
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
