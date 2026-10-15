import { afterEach, describe, expect, it, vi } from "vitest";

const headerValues = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (key: string) => headerValues.get(key) ?? null }),
}));

import {
  buildCourseShareMetadata,
  getCourseSharePageData,
} from "../server/get-course-share-page-data";

const validQuery = {
  n: "데이로",
  p: ["126.9854,37.5765,안국역", "126.9724,37.5781,서촌 카페", "126.977,37.5796,경복궁"],
};

afterEach(() => {
  headerValues.clear();
  vi.unstubAllEnvs();
});

describe("getCourseSharePageData", () => {
  it("받은 좌표로 네이버 길찾기(경유지 포함 도보) 주소를 조립한다", () => {
    const { naverUrl } = getCourseSharePageData(validQuery);
    expect(naverUrl).toMatch(/^https:\/\/map\.naver\.com\/p\/directions\//);
    expect(naverUrl).toContain(encodeURIComponent("서촌 카페"));
    expect(naverUrl).toMatch(/\/walk$/);
  });

  it("형식이 틀리면 이동 주소가 없다", () => {
    expect(getCourseSharePageData({ p: "https://evil.example" }).naverUrl).toBeNull();
    expect(getCourseSharePageData({}).naverUrl).toBeNull();
  });
});

describe("buildCourseShareMetadata", () => {
  it("og 제목 · 닉네임 설명 · 절대 주소 이미지 · noindex 를 채운다 (APP_ORIGIN 우선)", async () => {
    vi.stubEnv("APP_ORIGIN", "https://day-ro.com");
    headerValues.set("host", "internal.example");

    const metadata = await buildCourseShareMetadata(validQuery);

    expect(metadata.title).toBe("데이로-코스 일정");
    expect(metadata.description).toBe("데이로님의 코스 일정을 확인해 보세요!");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.openGraph).toMatchObject({
      title: "데이로-코스 일정",
      description: "데이로님의 코스 일정을 확인해 보세요!",
      images: [{ url: "https://day-ro.com/share/course-preview.jpg", width: 800, height: 800 }],
    });
    expect(String(metadata.openGraph?.url)).toMatch(/^https:\/\/day-ro\.com\/share\/course\/\?n=/);
  });

  it("APP_ORIGIN 이 없으면 요청 Host 로 절대 주소를 만든다 · 잘못된 링크는 고정 문구", async () => {
    vi.stubEnv("APP_ORIGIN", "");
    headerValues.set("host", "127.0.0.1:3100");

    const metadata = await buildCourseShareMetadata({});

    expect(metadata.description).toBe("데이로 코스 일정을 확인해 보세요!");
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: "http://127.0.0.1:3100/share/course-preview.jpg" }],
    });
  });
});
