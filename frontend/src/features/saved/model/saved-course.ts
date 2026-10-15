import type { CourseSummaryItem } from "../../../shared/api/openapi/dayro.openapi";

export interface SavedCourseCardViewModel {
  id: string;
  name: string;
  desc?: string;
  meta: string;
  date: string;
}

function formatSavedDate(createdAt: string) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return (
    new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(date)
      .replace(/\s/g, "")
      .replace(/\.$/, "") + " 저장"
  );
}

/**
 * 저장 코스 목록 API 응답을 `/saved` 카드 표시 계약으로 변환한다.
 * 목록 API 설명 필드는 카드 소개 문구로 그대로 노출한다.
 */
export function buildSavedCourseCardViewModel(
  course: CourseSummaryItem,
): SavedCourseCardViewModel {
  return {
    id: course.id,
    name: course.title,
    desc: course.description ?? undefined,
    meta: `${course.placeCount}곳 · ${course.regionName}`,
    date: formatSavedDate(course.createdAt),
  };
}
