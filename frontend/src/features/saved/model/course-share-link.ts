import type { CoursePoint } from "@/shared/lib/course-preview";

/**
 * 코스 공유 링크 (features/saved 순수 모델, issue #187).
 *
 * 공유 url 을 네이버 길찾기 주소 대신 데이로 공개 페이지(`/share/course/`)로 만들어,
 * 카카오톡 · 메신저 미리보기가 데이로 og 메타(제목 · 설명 · 이미지)를 읽게 한다.
 * 페이지는 받은 좌표 · 이름으로 네이버 길찾기 주소를 직접 조립하므로 임의 주소로 보내는 통로가 되지 않는다.
 */

/** 공유 페이지 경로. trailingSlash 설정에 맞춰 끝 슬래시를 붙인다. */
export const COURSE_SHARE_PATH = "/share/course/";

/** 공유 미리보기 이미지(public). */
export const COURSE_SHARE_IMAGE_PATH = "/share/course-preview.jpg";
export const COURSE_SHARE_IMAGE_SIZE = { width: 800, height: 800 } as const;

export const COURSE_SHARE_PREVIEW_TITLE = "데이로-코스 일정";
const FALLBACK_DESCRIPTION = "데이로 코스 일정을 확인해 보세요!";

export const COURSE_SHARE_LIMITS = {
  minPlaces: 2,
  maxPlaces: 10,
  maxPlaceNameLength: 50,
  maxSharerNameLength: 20,
} as const;

const SHARER_PARAM = "n";
const PLACE_PARAM = "p";
const COORD_DIGITS = 6;

export interface CourseShareInput {
  /** 공유하는 사용자 닉네임. 없으면 고정 설명 문구를 쓴다. */
  sharerName: string | null;
  /** 방문 순서대로 정렬된 코스 지점. */
  points: readonly CoursePoint[];
}

export interface ParsedCourseShare {
  sharerName: string | null;
  points: CoursePoint[];
}

/** 제어문자를 지우고 앞뒤 공백을 정리한다. */
function clean(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
}

/** 닉네임을 정리한다. 비었거나 길이를 넘으면 잘라내고, 남는 게 없으면 null. */
export function normalizeSharerName(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const cleaned = clean(value);
  if (!cleaned) {
    return null;
  }
  return Array.from(cleaned).slice(0, COURSE_SHARE_LIMITS.maxSharerNameLength).join("");
}

/** 미리보기 설명. 닉네임이 있으면 "OOO님의 코스 일정을 확인해 보세요!" */
export function buildCourseSharePreviewDescription(sharerName: string | null): string {
  const name = normalizeSharerName(sharerName);
  return name ? `${name}님의 코스 일정을 확인해 보세요!` : FALLBACK_DESCRIPTION;
}

function isValidPoint(point: CoursePoint): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

function roundCoord(value: number): string {
  return String(Number(value.toFixed(COORD_DIGITS)));
}

/**
 * 공유 url 을 만든다.
 * @param origin 공유 링크 origin (브라우저 `location.origin`).
 * @returns 좌표가 유효한 장소가 2곳 미만이면 null.
 */
export function buildCourseShareUrl(origin: string, input: CourseShareInput): string | null {
  const places = input.points
    .filter(isValidPoint)
    .map((point) => ({
      ...point,
      name: Array.from(clean(point.name))
        .slice(0, COURSE_SHARE_LIMITS.maxPlaceNameLength)
        .join(""),
    }))
    .filter((point) => point.name.length > 0)
    .slice(0, COURSE_SHARE_LIMITS.maxPlaces);
  if (places.length < COURSE_SHARE_LIMITS.minPlaces) {
    return null;
  }

  const params = new URLSearchParams();
  const sharerName = normalizeSharerName(input.sharerName);
  if (sharerName) {
    params.set(SHARER_PARAM, sharerName);
  }
  places.forEach((point) => {
    params.append(
      PLACE_PARAM,
      `${roundCoord(point.longitude)},${roundCoord(point.latitude)},${point.name}`,
    );
  });

  return new URL(`${COURSE_SHARE_PATH}?${params.toString()}`, origin).toString();
}

/** `경도,위도,이름` 한 칸을 지점으로 해석한다. 이름에 쉼표가 있어도 앞 두 칸만 좌표로 본다. */
function parsePlace(raw: string, index: number): CoursePoint | null {
  const first = raw.indexOf(",");
  const second = first < 0 ? -1 : raw.indexOf(",", first + 1);
  if (first < 0 || second < 0) {
    return null;
  }
  const lngText = raw.slice(0, first).trim();
  const latText = raw.slice(first + 1, second).trim();
  if (!lngText || !latText) {
    return null;
  }
  const longitude = Number(lngText);
  const latitude = Number(latText);
  const name = clean(raw.slice(second + 1));
  const point: CoursePoint = { order: index + 1, name, latitude, longitude };
  if (
    !isValidPoint(point) ||
    name.length === 0 ||
    Array.from(name).length > COURSE_SHARE_LIMITS.maxPlaceNameLength
  ) {
    return null;
  }
  return point;
}

/**
 * 공유 페이지 쿼리를 해석한다. 하나라도 형식이 틀리면 전체를 버린다(부분 경로로 이동하지 않음).
 * @returns 유효하면 닉네임 · 지점, 아니면 null.
 */
export function parseCourseShareParams(params: URLSearchParams): ParsedCourseShare | null {
  const rawPlaces = params.getAll(PLACE_PARAM);
  if (
    rawPlaces.length < COURSE_SHARE_LIMITS.minPlaces ||
    rawPlaces.length > COURSE_SHARE_LIMITS.maxPlaces
  ) {
    return null;
  }
  const points: CoursePoint[] = [];
  for (const [index, raw] of rawPlaces.entries()) {
    const point = parsePlace(raw, index);
    if (!point) {
      return null;
    }
    points.push(point);
  }
  return { sharerName: normalizeSharerName(params.get(SHARER_PARAM)), points };
}
