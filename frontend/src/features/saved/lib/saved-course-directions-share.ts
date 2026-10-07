import { buildNaverRouteDeepLink } from "@/features/course-map";
import type { CoursePoint } from "@/shared/lib/course-preview";

export interface SavedCourseDirectionsShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * 저장 코스의 현재 순서를 네이버지도 길안내 공유 데이터로 변환한다.
 * 공유는 보호 라우트 URL이 아니라 누구나 열 수 있는 네이버지도 웹 길찾기 링크를 사용한다.
 */
export function buildSavedCourseDirectionsShareData(
  courseTitle: string,
  points: readonly CoursePoint[],
): SavedCourseDirectionsShareData | null {
  const deepLink = buildNaverRouteDeepLink(points);
  if (!deepLink) {
    return null;
  }

  return {
    title: `${courseTitle} 길안내`,
    text: `${courseTitle} 네이버지도 길안내 링크예요.`,
    url: deepLink.webFallbackUrl,
  };
}
