import { describe, expect, it } from "vitest";

import type { CoursePoint } from "@/shared/lib/course-preview";
import { buildSavedCourseDirectionsShareData } from "../lib/saved-course-directions-share";

function point(order: number, name: string, lat: number, lng: number): CoursePoint {
  return { order, name, latitude: lat, longitude: lng };
}

const context = { origin: "https://day-ro.test", sharerName: "데이로" };

describe("buildSavedCourseDirectionsShareData", () => {
  it("현재 코스 순서로 데이로 공유 페이지 링크와 미리보기 문구를 만든다", () => {
    const shareData = buildSavedCourseDirectionsShareData(
      [
        point(1, "안국역", 37.5765, 126.9854),
        point(2, "서촌 카페", 37.5781, 126.9724),
        point(3, "경복궁", 37.5796, 126.977),
      ],
      context,
    );

    expect(shareData).toEqual({
      title: "데이로-코스 일정",
      text: "데이로님의 코스 일정을 확인해 보세요!",
      url: expect.stringContaining("https://day-ro.test/share/course/?"),
    });
    const places = new URL(shareData!.url).searchParams.getAll("p");
    expect(places.map((place) => place.split(",")[2])).toEqual(["안국역", "서촌 카페", "경복궁"]);
    expect(shareData?.url).not.toContain("map.naver.com");
  });

  it("좌표 유효 장소가 2곳 미만이면 공유 데이터를 만들지 않는다", () => {
    expect(
      buildSavedCourseDirectionsShareData([point(1, "안국역", 37.5765, 126.9854)], context),
    ).toBeNull();
  });
});
