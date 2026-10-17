import { BFF_ENDPOINTS } from "./endpoints";

/**
 * 장소 사진 BFF 경로 규칙 (QA #8, issue #219).
 *
 * 백엔드는 Google API 키를 숨기려고 사진을 `/api/places/photo?name=…` 프록시로 내려준다.
 * 프런트는 같은 경로의 BFF Route Handler 가 백엔드로 전달하므로, 응답의 상대경로를 그대로 쓰면 된다.
 * 경로 값은 BFF_ENDPOINTS 한 곳에서만 정의한다(issue #229).
 */
export const PLACE_PHOTO_PATH = BFF_ENDPOINTS.placePhoto;

/**
 * Google Places 사진 리소스 이름(`places/{placeId}/photos/{photoReference}`). 그 밖의 값은 백엔드로 보내지 않는다.
 * 백엔드 `GooglePlacesClient.PHOTO_NAME_PATTERN` 과 같은 문자 범위 — 사진 참조값 끝에 `=`(패딩)가 올 수 있다.
 * `=` 를 빼면 실제 사진이 전부 "사진 없음"으로 처리됐다(운영 확인, issue #219 후속).
 */
const PLACE_PHOTO_NAME = /^places\/[A-Za-z0-9_=-]+\/photos\/[A-Za-z0-9_=-]+$/;
const PLACE_PHOTO_NAME_MAX = 1024;

export function isValidPlacePhotoName(name: string | null | undefined): name is string {
  return typeof name === "string" && name.length <= PLACE_PHOTO_NAME_MAX && PLACE_PHOTO_NAME.test(name);
}

/**
 * 장소 `photoUrl` → 화면에 쓸 사진 주소.
 * 같은 출처 BFF 경로(`/api/places/photo?name=…`)이고 사진 이름이 올바를 때만 쓰고, 그 밖(null · 외부 주소 등)은 null.
 */
export function resolvePlacePhotoSrc(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(photoUrl, "http://same-origin.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "http://same-origin.invalid" || url.pathname !== PLACE_PHOTO_PATH) {
    return null;
  }
  const name = url.searchParams.get("name");
  return isValidPlacePhotoName(name) ? `${PLACE_PHOTO_PATH}?name=${encodeURIComponent(name)}` : null;
}
