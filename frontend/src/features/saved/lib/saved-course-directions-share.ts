import type { CoursePoint } from "@/shared/lib/course-preview";
import {
  COURSE_SHARE_PREVIEW_TITLE,
  buildCourseSharePreviewDescription,
  buildCourseShareUrl,
} from "../model/course-share-link";

export interface SavedCourseDirectionsShareData {
  title: string;
  text: string;
  url: string;
}

export interface SavedCourseShareContext {
  /** 공유 링크 origin (브라우저 `location.origin`). */
  origin: string;
  /** 공유하는 사용자 닉네임. */
  sharerName: string | null;
}

/**
 * 저장 코스의 현재 순서를 공유 데이터로 변환한다.
 * 공유 url 은 데이로 공개 공유 페이지(`/share/course/`)로, 열면 네이버지도 길찾기로 이동한다.
 * 카카오톡 · 메신저 미리보기는 그 페이지의 데이로 og 메타를 쓴다(issue #187).
 */
export function buildSavedCourseDirectionsShareData(
  points: readonly CoursePoint[],
  context: SavedCourseShareContext,
): SavedCourseDirectionsShareData | null {
  const url = buildCourseShareUrl(context.origin, {
    sharerName: context.sharerName,
    points,
  });
  if (!url) {
    return null;
  }

  return {
    title: COURSE_SHARE_PREVIEW_TITLE,
    text: buildCourseSharePreviewDescription(context.sharerName),
    url,
  };
}
