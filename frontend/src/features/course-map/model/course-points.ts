import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import type { CoursePoint } from "../hooks/useKakaoMap";

/**
 * 확정 장소 배열을 지도 렌더용 포인트 배열로 변환한다.
 * 좌표가 없는 장소는 제외하고, 선택 순서는 order 로 유지한다.
 *
 * @param places 확정 코스 장소 배열.
 * @returns 지도에 표시할 순번 포인트 배열.
 */
export function toCoursePoints(places: readonly PlaceCandidate[]): CoursePoint[] {
  return places
    .map((place, index) => ({
      order: index + 1,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
    }))
    .filter((point): point is CoursePoint => {
      return point.latitude != null && point.longitude != null;
    });
}
