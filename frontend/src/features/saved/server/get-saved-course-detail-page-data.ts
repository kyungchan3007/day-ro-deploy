import { getCourseDetailForServerComponent } from "../../../shared/api/server-course";
import {
  buildSavedCourseDetailViewModel,
  type SavedCourseDetailViewModel,
} from "../model/saved-course-detail";

export interface SavedCourseDetailPageData {
  course: SavedCourseDetailViewModel;
}

/**
 * `/saved/[id]` 서버 엔트리 데이터 준비 함수.
 * 현재 로그인 사용자의 저장 코스 상세를 서버에서 읽고 공통 지도 화면 계약으로 정규화한다.
 */
export async function getSavedCourseDetailPageData(
  courseId: string,
): Promise<SavedCourseDetailPageData> {
  const response = await getCourseDetailForServerComponent(courseId);

  return {
    course: buildSavedCourseDetailViewModel(response.data),
  };
}
