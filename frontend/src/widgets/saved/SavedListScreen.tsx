import { AppShell } from "@/shared/ui";
import { AccountNavBar } from "@/features/auth";
import type { SavedCourseCardViewModel } from "@/features/saved";
import { savedStatic } from "@/shared/static/saved";
import { SavedCourseListClient } from "./SavedCourseListClient";

export interface SavedListScreenProps {
  courses: SavedCourseCardViewModel[];
}

/**
 * 찜한 코스 목록 화면 (widgets/saved).
 *
 * 내정보처럼 AppShell 640 컬럼 일반 화면.
 *   - NavBar(뒤로 → 홈 + "찜한 코스") + 저장 코스 카드 리스트(없으면 빈 상태).
 *   - AppShell·NavBar 등 정적 영역은 서버에 유지하고, 삭제 등 상호작용이 있는
 *     리스트 본문만 클라이언트 컴포넌트(SavedCourseListClient)로 위임한다.
 *   - 목록 데이터는 상위 page 가 SSR 로 준비한 뒤 props 로 내려준다.
 */
export function SavedListScreen({ courses }: SavedListScreenProps) {
  const { navTitle } = savedStatic;

  return (
    <AppShell
      bleed
      nav={
        <AccountNavBar
          backHref="/"
          center={
            <span className="text-lg font-bold text-text-strong">
              {navTitle}
            </span>
          }
        />
      }
    >
      <h1 className="sr-only">{navTitle}</h1>
      <SavedCourseListClient initialCourses={courses} />
    </AppShell>
  );
}
