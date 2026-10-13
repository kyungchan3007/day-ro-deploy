import "server-only";

import type { SessionUser } from "../../../shared/api/auth-session";
import { getCourseDetailForServerComponent } from "../../../shared/api/server-course";
import { normalizeSharerName } from "../model/course-share-link";
import {
  buildSavedCourseDetailViewModel,
  type SavedCourseDetailViewModel,
} from "../model/saved-course-detail";

export interface SavedCourseDetailPageData {
  course: SavedCourseDetailViewModel;
  /** 공유 미리보기 설명에 넣을 닉네임(issue #187). */
  sharerName: string | null;
}

/**
 * `/saved/[id]` 서버 엔트리 데이터 준비 함수.
 * 현재 로그인 사용자의 저장 코스 상세를 서버에서 읽고 공통 지도 화면 계약으로 정규화한다.
 * @param user 서버 가드가 확인한 로그인 사용자. 닉네임 → 이름 순으로 공유 닉네임을 정한다.
 */
export async function getSavedCourseDetailPageData(
  courseId: string,
  user?: Pick<SessionUser, "nickname" | "name"> | null,
): Promise<SavedCourseDetailPageData> {
  const response = await getCourseDetailForServerComponent(courseId);

  return {
    course: buildSavedCourseDetailViewModel(response.data),
    sharerName: normalizeSharerName(user?.nickname ?? user?.name),
  };
}
