import { describe, expect, it } from "vitest";

import type { CoursePoint } from "@/shared/lib/course-preview";
import { buildSavedCourseDirectionsShareData } from "../lib/saved-course-directions-share";

function point(order: number, name: string, lat: number, lng: number): CoursePoint {
  return { order, name, latitude: lat, longitude: lng };
}

describe("buildSavedCourseDirectionsShareData", () => {
  it("현재 코스 순서로 네이버지도 웹 길안내 공유 데이터를 만든다", () => {
    const shareData = buildSavedCourseDirectionsShareData("서촌 데이트 코스", [
      point(1, "안국역", 37.5765, 126.9854),
      point(2, "서촌 카페", 37.5781, 126.9724),
      point(3, "경복궁", 37.5796, 126.977),
    ]);

    expect(shareData).toEqual({
      title: "서촌 데이트 코스 길안내",
      text: "서촌 데이트 코스 네이버지도 길안내 링크예요.",
      url: expect.stringContaining("https://map.naver.com/p/directions/"),
    });
    expect(shareData?.url).toContain(encodeURIComponent("안국역"));
    expect(shareData?.url).toContain(encodeURIComponent("경복궁"));
    expect(shareData?.url).toContain(encodeURIComponent("서촌 카페"));
    expect(shareData?.url).toContain("/walk");
  });

  it("좌표 유효 장소가 2곳 미만이면 공유 데이터를 만들지 않는다", () => {
    expect(
      buildSavedCourseDirectionsShareData("서촌 데이트 코스", [
        point(1, "안국역", 37.5765, 126.9854),
      ]),
    ).toBeNull();
  });
});
