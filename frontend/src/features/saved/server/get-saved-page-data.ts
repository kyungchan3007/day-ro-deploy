import { getCoursesForServerComponent } from "../../../shared/api/server-course";
import {
  buildSavedCourseCardViewModel,
  type SavedCourseCardViewModel,
} from "../model/saved-course";

export interface SavedPageData {
  courses: SavedCourseCardViewModel[];
}

/**
 * `/saved` 서버 엔트리 데이터 준비 함수.
 * 현재 로그인 사용자의 저장 코스 목록을 서버에서 읽고 카드 표시 계약으로 정규화한다.
 */
export async function getSavedPageData(): Promise<SavedPageData> {
  const response = await getCoursesForServerComponent();

  return {
    courses: response.data.map(buildSavedCourseCardViewModel),
  };
}
