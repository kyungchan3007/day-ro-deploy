import Link from "next/link";
import { AppShell, NavBar, LogoHorizontal } from "@/shared/ui";
import { HomeEntryCard } from "@/features/home";
import { AccountMenu } from "@/features/auth";
import { homeStatic } from "@/shared/static/home";
import imgCreate from "./assets/img-create.png";
import imgSaved from "./assets/img-saved.png";

/**
 * 홈(루트) 화면 (widgets/home).
 *
 * 여러 조각을 하나의 진입 화면으로 조합한다.
 *   - 헤더(NavBar, 뒤로가기 없음) + 보라 그라데이션 본문 + 미색 푸터(로고 + 정책 링크 + 저작권).
 *   - 본문 중앙에 진입 카드 2개(features/home).
 *   - 정적 문구는 shared/static/home, 일러스트는 위젯 에셋을 카드에 주입.
 *   - server component 로 SSR 렌더.
 */
export function HomeScreen() {
  const { create, saved } = homeStatic.cards;
  const { links, copyright } = homeStatic.footer;

  return (
    <AppShell
      bleed
      nav={<NavBar showBack={false} right={<AccountMenu />} />}
      footer={
        <footer className="flex flex-col gap-1.5 border-t border-border bg-surface-subtle px-5 pb-4 pt-3">
          <div className="flex items-center justify-between gap-1.5">
            <LogoHorizontal height={18} className="shrink-0" />
            <nav
              aria-label="정책 및 고객지원"
              className="flex items-center gap-2 text-[13px] font-semibold text-text-muted"
            >
              {links.map((link, index) => (
                <span key={link.href} className="flex items-center gap-2">
                  {index > 0 && (
                    <span aria-hidden className="text-border-strong">
                      ·
                    </span>
                  )}
                  <Link
                    href={link.href}
                    className="rounded transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:opacity-60"
                  >
                    {link.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>
          <p className="text-center text-[13px] text-text-disabled">
            {copyright}
          </p>
        </footer>
      }
      className="flex flex-col justify-center items-center gap-6 bg-gradient-to-b from-primary-800 via-primary-600 to-primary-300"
    >
      <h1 className="sr-only">Dayro 홈</h1>
      <section aria-labelledby="home-entry-heading" className="w-full">
        <h2 id="home-entry-heading" className="sr-only">
          주요 서비스 진입
        </h2>
        <ul className="flex flex-col items-center gap-6">
          <li>
            <HomeEntryCard
              image={imgCreate}
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
