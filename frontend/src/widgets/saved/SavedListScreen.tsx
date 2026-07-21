import { AppShell, NavBar } from "@/shared/ui";
import { SavedCourseCard } from "@/features/saved";
import { savedStatic } from "@/shared/static/saved";

/**
 * 찜한 코스 목록 화면 (widgets/saved).
 *
 * 내정보처럼 AppShell 640 컬럼 일반 화면.
 *   - NavBar(뒤로 → 홈 + "찜한 코스") + 저장 코스 카드 리스트(없으면 빈 상태).
 *   - 목록 데이터는 shared/static/saved(placeholder). server component 로 SSR 렌더.
 *
 * NOTE: 카드 href 는 상세(/saved/[id]) 미구현이라 "#" placeholder.
 */
export function SavedListScreen() {
  const { navTitle, emptyText, courses } = savedStatic;

  return (
    <AppShell
      bleed
      nav={
        <NavBar
          backHref="/"
          center={
            <span className="text-lg font-bold text-text-strong">
              {navTitle}
            </span>
          }
        />
      }
    >
      {courses.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-text-disabled">
          {emptyText}
        </p>
      ) : (
        <div className="flex flex-col gap-3 px-5 py-4">
          {courses.map((course, i) => (
            <SavedCourseCard
              key={course.id}
              number={i + 1}
              name={course.name}
              desc={course.desc}
              meta={course.meta}
              date={course.date}
              href="#"
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
