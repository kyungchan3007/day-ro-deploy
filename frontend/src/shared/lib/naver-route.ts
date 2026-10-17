/**
 * 확정 코스 → 네이버지도 도보 길안내 링크 빌더 (shared/lib 순수 유틸).
 * course-map(경로 안내) · saved(공유 페이지) 두 feature 가 함께 쓰므로 shared 로 옮겼다(issue #229).
 *
 * 좌표가 있는 코스 장소를 방문 순서대로 묶어 네이버지도 도보 길찾기 주소로 만든다.
 * 첫 장소를 출발지, 마지막 장소를 도착지, 그 사이를 경유지로 둔다.
 *
 * 코스 장소는 보통 도보권에 모여 있어 장소 간 이동은 이동수단 선택과 무관하게 도보로 안내한다.
 * 실제로 여는 주소는 웹 길찾기(`webFallbackUrl`)뿐이다. 앱 스킴(`appUrl`)은 시도하지 않고
 * (팝업 차단 회피, 모바일은 네이버 웹이 앱 열기를 안내) 테스트에서 경로 구성 검증용으로만 쓴다.
 * 브라우저 전역(window/document)에 의존하지 않는 결정적 함수다.
 */

import type { CoursePoint } from "@/shared/lib/course-preview";

/** 앱 스킴(`appUrl`)의 "돌아가기" 콜백 식별자(appname). 테스트 검증용(issue #229). */
export const ROUTE_DEEPLINK_APPNAME = "dayro";

/** 길안내 가능한 최소 지점 수(출발 + 도착). */
export const MIN_ROUTE_POINTS = 2;

/** 웹 길찾기 URL 에서 비어 있는 경유지 슬롯 자리표시자. */
const EMPTY_WEB_SLOT = "-";

/** 코스 장소 간 이동은 항상 도보로 안내한다(앱 · 웹 공통, issue #229 통합). */
const ROUTE_MODE = "walk";

export interface RouteDeepLink {
  /** 네이버지도 앱 스킴(`nmap://route/walk...`). 화면에서는 열지 않고 테스트 검증용으로만 쓴다. */
  appUrl: string;
  /** 실제로 새 탭에서 여는 네이버지도 웹 길찾기 URL. */
  webFallbackUrl: string;
}

/** 좌표가 유효한(유한한 위경도) 지점만 남긴다. */
function withValidCoords(points: readonly CoursePoint[]): CoursePoint[] {
  return points.filter(
    (point) =>
      Number.isFinite(point.latitude) && Number.isFinite(point.longitude),
  );
}

/** `key=encodedValue` 한 쌍. 공백은 항상 %20 으로 인코딩한다(네이티브 스킴 파서 호환). */
function param(key: string, value: string | number): string {
  return `${key}=${encodeURIComponent(String(value))}`;
}

/**
 * 웹 길찾기 URL (map.naver.com). 화면이 실제로 여는 주소다.
 *
 * 실측 URL 구조: `{출발}/{도착}/{경유지1[:경유지2:…]}/walk` (슬롯 4칸 고정).
 * 출발이 첫 세그먼트, 도착이 두 번째 세그먼트이고, 경유지는 **하나의 세그먼트 안에서 `:` 로**
 * 이어 붙인다. 경유지를 각각 별도 `/` 세그먼트로 두면 두 번째 경유지가 이동수단 슬롯을 먹어
 * 경유지가 1개만 잡히고 모드가 기본값(자동차)으로 떨어진다. 경유지가 없으면 그 슬롯을 `-` 로
 * 채운다(슬롯을 빼면 `walk` 가 경유지 슬롯으로 밀려 경로가 그려지지 않는다, issue #163 실측).
 * 각 지점은 `경도,위도,이름` 3필드로 적는다.
 *
 * 주의: 네이버는 웹 URL 스킴을 공식 문서화하지 않는다. 이 구조는 경유지 2개 도보 경로의 실제
 * URL 로, 경유지 없음(`-`)은 장소 2곳 도보 경로로 확인했다.
 */
function buildWebFallbackUrl(
  start: CoursePoint,
  waypoints: readonly CoursePoint[],
  dest: CoursePoint,
): string {
  const encode = (point: CoursePoint) =>
    `${point.longitude},${point.latitude},${encodeURIComponent(point.name)}`;
  const waypointSlot =
    waypoints.length > 0 ? waypoints.map(encode).join(":") : EMPTY_WEB_SLOT;
  const segments = [encode(start), encode(dest), waypointSlot, ROUTE_MODE];
  return `https://map.naver.com/p/directions/${segments.join("/")}`;
}

/**
 * 코스 지점으로 네이버지도 도보 길안내 링크(웹 · 앱 스킴)를 만든다.
 *
 * @param points 방문 순서대로 정렬된 코스 지점(좌표 없는 지점은 내부에서 제외).
 * @returns 좌표 유효 지점이 2곳 이상이면 링크, 아니면 null.
 */
export function buildNaverRouteDeepLink(
  points: readonly CoursePoint[],
): RouteDeepLink | null {
  const valid = withValidCoords(points);
  if (valid.length < MIN_ROUTE_POINTS) {
    return null;
  }

  const start = valid[0]!;
  const dest = valid[valid.length - 1]!;
  const waypoints = valid.slice(1, -1);

  const parts: string[] = [
    param("slat", start.latitude),
    param("slng", start.longitude),
    param("sname", start.name),
  ];

  waypoints.forEach((waypoint, index) => {
    const n = index + 1;
    parts.push(param(`v${n}lat`, waypoint.latitude));
    parts.push(param(`v${n}lng`, waypoint.longitude));
    parts.push(param(`v${n}name`, waypoint.name));
  });

  parts.push(param("dlat", dest.latitude));
  parts.push(param("dlng", dest.longitude));
  parts.push(param("dname", dest.name));
  parts.push(param("appname", ROUTE_DEEPLINK_APPNAME));

  return {
    appUrl: `nmap://route/${ROUTE_MODE}?${parts.join("&")}`,
    webFallbackUrl: buildWebFallbackUrl(start, waypoints, dest),
  };
}
