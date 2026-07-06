import { AppShell, NavBar, LogoHorizontal } from "@/shared/ui";
import { HomeEntryCard } from "@/features/home";
import { homeStatic } from "@/shared/static/home";
import imgCreate from "./assets/img-create.png";
import imgSaved from "./assets/img-saved.png";

/**
 * 홈(루트) 화면 (widgets/home).
 *
 * 여러 조각을 하나의 진입 화면으로 조합한다.
 *   - 헤더(NavBar, 뒤로가기 없음) + 보라 그라데이션 본문 + 미색 푸터 로고 바.
 *   - 본문 중앙에 진입 카드 2개(features/home).
 *   - 정적 문구는 shared/static/home, 일러스트는 위젯 에셋을 카드에 주입.
 *   - server component 로 SSR 렌더.
 */
export function HomeScreen() {
  const { create, saved } = homeStatic.cards;

  return (
    <AppShell
      bleed
      nav={<NavBar showBack={false} />}
      footer={
        <footer className="flex justify-center border-t border-border bg-surface-subtle py-4">
          <LogoHorizontal height={18} />
        </footer>
      }
      className="flex flex-col justify-center items-center gap-6 bg-gradient-to-b from-primary-800 via-primary-600 to-primary-300"
    >
      <HomeEntryCard
        image={imgCreate}
        title={create.title}
        subtitle={create.subtitle}
        href={create.href}
      />
      <HomeEntryCard
        image={imgSaved}
        title={saved.title}
        subtitle={saved.subtitle}
        href={saved.href}
      />
    </AppShell>
  );
}
