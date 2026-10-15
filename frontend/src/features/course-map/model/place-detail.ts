import { courseMapStatic } from "@/shared/static/course-map";
import type { CoursePlaceItem } from "@/shared/lib/course-preview";

export interface PlaceDetailRow {
  label: string;
  value: string;
  /** 값이 없어 대체 문구를 보여주는 줄(흐리게 표시). */
  empty?: boolean;
}

/**
 * 장소 드롭다운 상세 줄 (QA #8, issue #219).
 * 순서: 영업시간 → 주소 → 평점. 영업시간은 Google 데이터가 없으면(null) 숨기지 않고 "영업시간 정보 없음".
 * "24시간 영업" 등 백엔드 문자열은 그대로 보여준다.
 */
export function buildPlaceDetails(
  place: Pick<CoursePlaceItem, "businessHours" | "address" | "rating">,
): PlaceDetailRow[] {
  const copy = courseMapStatic.placeDetail;
  const hours = place.businessHours?.trim();
  const rows: PlaceDetailRow[] = [
    hours
      ? { label: copy.hoursLabel, value: hours }
      : { label: copy.hoursLabel, value: copy.hoursEmpty, empty: true },
  ];
  if (place.address) {
    rows.push({ label: copy.addressLabel, value: place.address });
  }
  if (place.rating != null) {
    rows.push({ label: copy.ratingLabel, value: place.rating.toFixed(1) });
  }
  return rows;
}
