import { describe, expect, it } from "vitest";

import type { CoursePoint } from "@/shared/lib/course-preview";
import {
  COURSE_SHARE_LIMITS,
  buildCourseSharePreviewDescription,
  buildCourseShareUrl,
  normalizeSharerName,
  parseCourseShareParams,
} from "../model/course-share-link";

const ORIGIN = "https://day-ro.test";

function point(order: number, name: string, lat: number, lng: number): CoursePoint {
  return { order, name, latitude: lat, longitude: lng };
}

const course = [
  point(1, "안국역", 37.5765123456, 126.9854),
  point(2, "서촌, 카페", 37.5781, 126.9724),
  point(3, "경복궁", 37.5796, 126.977),
];

function paramsOf(url: string) {
  return new URL(url).searchParams;
}

describe("buildCourseShareUrl", () => {
  it("데이로 공유 페이지 주소에 닉네임 · 장소(경도,위도,이름)를 순서대로 담는다", () => {
    const url = buildCourseShareUrl(ORIGIN, { sharerName: "데이로", points: course });

    expect(url).toMatch(/^https:\/\/day-ro\.test\/share\/course\/\?/);
    const params = paramsOf(url!);
    expect(params.get("n")).toBe("데이로");
    expect(params.getAll("p")).toEqual([
      "126.9854,37.576512,안국역",
      "126.9724,37.5781,서촌, 카페",
      "126.977,37.5796,경복궁",
    ]);
  });

  it("닉네임이 없으면 n 을 넣지 않는다", () => {
    const url = buildCourseShareUrl(ORIGIN, { sharerName: "  ", points: course });
    expect(paramsOf(url!).has("n")).toBe(false);
  });

  it("좌표가 유효한 장소가 2곳 미만이면 null", () => {
    expect(
      buildCourseShareUrl(ORIGIN, {
        sharerName: null,
        points: [course[0]!, point(2, "어딘가", Number.NaN, 127)],
      }),
    ).toBeNull();
  });

  it("장소는 최대 개수까지만 담는다", () => {
    const many = Array.from({ length: 12 }, (_, i) => point(i + 1, `장소${i + 1}`, 37.5, 127));
    const url = buildCourseShareUrl(ORIGIN, { sharerName: null, points: many });
    expect(paramsOf(url!).getAll("p")).toHaveLength(COURSE_SHARE_LIMITS.maxPlaces);
  });
});

describe("parseCourseShareParams", () => {
  it("만든 공유 주소를 같은 닉네임 · 장소로 되돌린다 (이름 속 쉼표 유지)", () => {
    const url = buildCourseShareUrl(ORIGIN, { sharerName: "데이로", points: course })!;

    expect(parseCourseShareParams(paramsOf(url))).toEqual({
      sharerName: "데이로",
      points: [
        point(1, "안국역", 37.576512, 126.9854),
        point(2, "서촌, 카페", 37.5781, 126.9724),
        point(3, "경복궁", 37.5796, 126.977),
      ],
    });
  });

  it.each([
    ["장소 1곳", "p=127,37.5,A"],
    ["좌표 아님", "p=abc,37.5,A&p=127,37.5,B"],
    ["좌표 비어 있음", "p=,37.5,A&p=127,37.5,B"],
    ["위도 범위 밖", "p=127,91,A&p=127,37.5,B"],
    ["경도 범위 밖", "p=181,37.5,A&p=127,37.5,B"],
    ["이름 없음", "p=127,37.5,&p=127,37.5,B"],
    ["칸 부족", "p=127,37.5&p=127,37.5,B"],
    ["이름 너무 김", `p=127,37.5,${"가".repeat(51)}&p=127,37.5,B`],
    ["장소 너무 많음", Array.from({ length: 11 }, () => "p=127,37.5,A").join("&")],
  ])("%s → null (부분 경로로 이동하지 않음)", (_label, query) => {
    expect(parseCourseShareParams(new URLSearchParams(query))).toBeNull();
  });

  it("닉네임의 제어문자를 지우고 길이를 자른다", () => {
    const parsed = parseCourseShareParams(
      new URLSearchParams({ n: `\u0000${"가".repeat(30)}` , p: "127,37.5,A" }),
    );
    expect(parsed).toBeNull();

    const params = new URLSearchParams(`p=127,37.5,A&p=127.1,37.6,B`);
    params.set("n", `\u0007${"가".repeat(30)}`);
    expect(parseCourseShareParams(params)?.sharerName).toBe("가".repeat(20));
  });
});

describe("미리보기 문구", () => {
  it("닉네임이 있으면 'OOO님의 코스 일정을 확인해 보세요!'", () => {
    expect(buildCourseSharePreviewDescription("데이로")).toBe(
      "데이로님의 코스 일정을 확인해 보세요!",
    );
  });

  it("닉네임이 없으면 고정 문구", () => {
    expect(buildCourseSharePreviewDescription(null)).toBe("데이로 코스 일정을 확인해 보세요!");
    expect(normalizeSharerName("\n ")).toBeNull();
  });
});
