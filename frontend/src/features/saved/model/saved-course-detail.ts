import {
  courseUpdateRequestSchema,
  type CourseDetailResponseData,
  type CourseUpdateRequest,
} from "../../../shared/api/openapi/dayro.openapi";
import type { CoursePlaceItem } from "../../../shared/lib/course-preview";

export interface SavedCourseDetailViewModel {
  id: string;
  title: string;
  description: string;
  places: CoursePlaceItem[];
}

/**
 * 저장 코스 상세 응답을 공통 코스 프리뷰 화면 계약으로 변환한다.
 * 상세 API 에 district 가 없어 리스트 메타는 비워 두고, 나머지 표시 필드는 그대로 사용한다.
 */
export function buildSavedCourseDetailViewModel(
  course: CourseDetailResponseData,
): SavedCourseDetailViewModel {
  return {
    id: course.id,
    title: course.title,
    description: course.description ?? "",
    places: course.places.map((place) => ({
      placeId: place.placeId,
      name: place.name,
      category: place.category,
      district: undefined,
      address: place.address,
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      businessHours: place.businessHours,
      latitude: place.latitude,
      longitude: place.longitude,
      photoUrl: place.photoUrl,
    })),
  };
}

/**
 * 저장 코스 상세 화면 상태를 수정 API 요청 계약으로 직렬화한다.
 * 제목/설명은 현재 저장된 값을 유지하고, placeIds 순서로 변경된 방문 순서를 전달한다.
 */
export function buildSavedCourseUpdateRequest(
  course: SavedCourseDetailViewModel,
  places: readonly CoursePlaceItem[],
): CourseUpdateRequest {
  return courseUpdateRequestSchema.parse({
    title: course.title,
    description: course.description || null,
    placeIds: places.map((place) => place.placeId),
  });
}
