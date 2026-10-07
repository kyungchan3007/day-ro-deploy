import { describe, expect, it } from "vitest";

import type { CoursePoint } from "@/shared/lib/course-preview";
import {
  ROUTE_DEEPLINK_APPNAME,
  buildNaverRouteDeepLink,
} from "../lib/route-deeplink";

function point(order: number, name: string, lat: number, lng: number): CoursePoint {
  return { order, name, latitude: lat, longitude: lng };
}

const start = point(1, "성수 카페", 37.5445, 127.0559);
const middle = point(2, "서울숲", 37.5443, 127.0374);
const dest = point(3, "한강 공원", 37.5299, 127.0668);

/** appUrl 의 query 를 파싱해 검사하기 쉬운 형태로 돌려준다. */
function parseAppUrl(appUrl: string): { mode: string; params: URLSearchParams } {
  const [scheme, query = ""] = appUrl.split("?");
  const mode = scheme.replace("nmap://route/", "");
  return { mode, params: new URLSearchParams(query) };
}

describe("buildNaverRouteDeepLink", () => {
  it("좌표 유효 장소가 2곳 미만이면 null 을 반환한다", () => {
    expect(buildNaverRouteDeepLink([])).toBeNull();
    expect(buildNaverRouteDeepLink([start])).toBeNull();
  });

  it("경로 안내는 항상 도보(walk) 모드로 만든다", () => {
    const { mode } = parseAppUrl(buildNaverRouteDeepLink([start, dest])!.appUrl);
    expect(mode).toBe("walk");
  });

  it("장소 2곳이면 출발·도착만 담고 경유지는 없다", () => {
    const link = buildNaverRouteDeepLink([start, dest]);
    expect(link).not.toBeNull();

    const { params } = parseAppUrl(link!.appUrl);
    expect(params.get("slat")).toBe("37.5445");
    expect(params.get("slng")).toBe("127.0559");
    expect(params.get("sname")).toBe("성수 카페");
    expect(params.get("dlat")).toBe("37.5299");
    expect(params.get("dname")).toBe("한강 공원");
    expect(params.get("v1lat")).toBeNull();
    expect(params.get("appname")).toBe(ROUTE_DEEPLINK_APPNAME);
  });

  it("3곳 이상이면 중간 장소를 경유지(v1..)로 담는다", () => {
    const link = buildNaverRouteDeepLink([start, middle, dest]);
    const { params } = parseAppUrl(link!.appUrl);

    expect(params.get("v1lat")).toBe("37.5443");
    expect(params.get("v1lng")).toBe("127.0374");
    expect(params.get("v1name")).toBe("서울숲");
    // 도착지는 여전히 마지막 장소.
    expect(params.get("dname")).toBe("한강 공원");
    // 경유지는 하나뿐이므로 v2 는 없다.
    expect(params.get("v2lat")).toBeNull();
  });

  it("경유지가 여러 개면 v1..vN 로 모두 담는다", () => {
    const middle2 = point(3, "카페 온화", 37.541, 127.05);
    const link = buildNaverRouteDeepLink([start, middle, middle2, dest]);
    const { params } = parseAppUrl(link!.appUrl);

    expect(params.get("v1name")).toBe("서울숲");
    expect(params.get("v2name")).toBe("카페 온화");
    expect(params.get("v3lat")).toBeNull();
    expect(params.get("dname")).toBe("한강 공원");
  });

  it("좌표 없는 장소는 경로 구성에서 제외한다", () => {
    const noCoords = point(2, "좌표없음", Number.NaN, Number.NaN);
    const link = buildNaverRouteDeepLink([start, noCoords, dest]);
    const { params } = parseAppUrl(link!.appUrl);

    // noCoords 가 빠지면서 경유지가 사라지고 출발·도착만 남는다.
    expect(params.get("v1lat")).toBeNull();
    expect(params.get("sname")).toBe("성수 카페");
    expect(params.get("dname")).toBe("한강 공원");
  });

  it("좌표 제외 후 2곳 미만이면 null 을 반환한다", () => {
    const noCoords = point(2, "좌표없음", Number.NaN, Number.NaN);
    expect(buildNaverRouteDeepLink([start, noCoords])).toBeNull();
  });

  it("장소 이름의 공백·특수문자를 URL 인코딩한다", () => {
    const spaced = point(1, "카페 & 디저트", 37.5, 127.0);
    const link = buildNaverRouteDeepLink([spaced, dest]);

    // 원본 rawUrl 에는 공백/& 가 그대로 남으면 안 된다(%20, %26 로 인코딩).
    expect(link!.appUrl).toContain("sname=%EC%B9%B4%ED%8E%98%20%26%20%EB%94%94%EC%A0%80%ED%8A%B8");
    // 파싱하면 원래 이름으로 복원된다.
    const { params } = parseAppUrl(link!.appUrl);
    expect(params.get("sname")).toBe("카페 & 디저트");
  });

  it("웹 폴백은 네이버 도보 길찾기 URL 이고 경유지 없으면 3 세그먼트다", () => {
    const link = buildNaverRouteDeepLink([start, dest]);
    const segments = link!.webFallbackUrl
      .replace("https://map.naver.com/p/directions/", "")
      .split("/");
    // 경유지 없음 → [출발, 도착, walk] 3 세그먼트.
    expect(segments).toHaveLength(3);
    expect(segments[2]).toBe("walk");
  });

  it("웹 폴백은 출발/도착/경유지/walk 순서로 세그먼트를 둔다", () => {
    const link = buildNaverRouteDeepLink([start, middle, dest]);
    const segments = link!.webFallbackUrl
      .replace("https://map.naver.com/p/directions/", "")
      .split("/");
    // [출발, 도착, 경유지1, walk] — 도착이 2번째, 경유지는 도착 뒤.
    expect(segments).toHaveLength(4);
    expect(segments[0]).toContain(encodeURIComponent("성수 카페")); // 출발
    expect(segments[1]).toContain(encodeURIComponent("한강 공원")); // 도착
    expect(segments[2]).toContain(encodeURIComponent("서울숲")); // 경유지
    expect(segments[2]).toContain("127.0374");
    expect(segments[3]).toBe("walk"); // 모드
  });

  it("웹 폴백은 경유지가 여러 개면 한 세그먼트 안에서 ':' 로 잇는다", () => {
    const middle2 = point(3, "카페 온화", 37.541, 127.05);
    const link = buildNaverRouteDeepLink([start, middle, middle2, dest]);
    const segments = link!.webFallbackUrl
      .replace("https://map.naver.com/p/directions/", "")
      .split("/");
    // 경유지를 각각 '/' 로 두면 두 번째 경유지가 이동수단 슬롯을 먹어 경유지 1개만 잡히고
    // 모드가 기본값으로 떨어진다. → 반드시 [출발, 도착, "경유지1:경유지2", walk] 4 세그먼트.
    expect(segments).toHaveLength(4);
    expect(segments[3]).toBe("walk"); // 모드는 항상 마지막 슬롯
    // 경유지 슬롯 하나에 두 경유지가 ':' 로 함께 들어간다.
    expect(segments[2]).toContain(encodeURIComponent("서울숲"));
    expect(segments[2]).toContain(encodeURIComponent("카페 온화"));
    expect(segments[2].split(":")).toHaveLength(2);
  });
});
