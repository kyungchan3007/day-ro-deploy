export interface CoursePlaceItem {
  placeId: string;
  name: string;
  category?: string | null;
  district?: string | null;
  address?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
  businessHours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  photoUrl?: string | null;
}

export interface CoursePoint {
  order: number;
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * from 위치의 항목을 to 위치로 옮긴 새 배열을 반환한다.
 */
export function reorderCoursePlaces<T extends CoursePlaceItem>(
  places: readonly T[],
  from: number,
  to: number,
): T[] {
  const next = [...places];
  if (
    from < 0 ||
    from >= next.length ||
    to < 0 ||
    to >= next.length ||
    from === to
  ) {
    return next;
  }

  const [moved] = next.splice(from, 1);
  if (!moved) {
    return next;
  }
  next.splice(to, 0, moved);
  return next;
}

/**
 * 두 배열의 방문 순서(placeId 시퀀스)가 완전히 같은지 확인한다.
 */
export function isSameCourseOrder<T extends CoursePlaceItem>(
  a: readonly T[],
  b: readonly T[],
): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((place, index) => place.placeId === b[index]?.placeId);
}

/**
 * 확정 장소 배열을 지도 렌더용 포인트 배열로 변환한다.
 */
export function toCoursePreviewPoints<T extends CoursePlaceItem>(
  places: readonly T[],
): CoursePoint[] {
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
