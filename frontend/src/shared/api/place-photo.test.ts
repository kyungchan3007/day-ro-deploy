import { describe, expect, it } from "vitest";

import { isValidPlacePhotoName, readClientIp, resolvePlacePhotoSrc } from "./place-photo";

/** issue #219 (QA #8): 장소 사진 BFF 경로. */
describe("resolvePlacePhotoSrc", () => {
  it("백엔드 상대경로를 같은 출처 BFF 경로로 쓴다", () => {
    expect(resolvePlacePhotoSrc("/api/places/photo?name=places%2Fabc%2Fphotos%2Fxyz")).toBe(
      "/api/places/photo?name=places%2Fabc%2Fphotos%2Fxyz",
    );
  });

  it("사진 참조값에 = (패딩)가 있어도 쓴다 — 백엔드 규칙과 같음", () => {
    const name = "places/ChIJ_abc-1/photos/AXCi2Q_x-9==";
    expect(resolvePlacePhotoSrc(`/api/places/photo?name=${encodeURIComponent(name)}`)).toBe(
      `/api/places/photo?name=${encodeURIComponent(name)}`,
    );
  });

  it("null · 빈 값 · 외부 주소 · 다른 경로 · 잘못된 이름은 쓰지 않는다", () => {
    expect(resolvePlacePhotoSrc(null)).toBeNull();
    expect(resolvePlacePhotoSrc("")).toBeNull();
    expect(resolvePlacePhotoSrc("https://evil.example/api/places/photo?name=places%2Fa%2Fphotos%2Fb")).toBeNull();
    expect(resolvePlacePhotoSrc("/api/courses?name=places%2Fa%2Fphotos%2Fb")).toBeNull();
    expect(resolvePlacePhotoSrc("/api/places/photo?name=..%2Fsecret")).toBeNull();
    expect(resolvePlacePhotoSrc("/api/places/photo")).toBeNull();
  });
});

describe("isValidPlacePhotoName", () => {
  it("places/{id}/photos/{id} 형식만 허용한다", () => {
    expect(isValidPlacePhotoName("places/ChIJ_abc-1/photos/AXCi2Q_x-9")).toBe(true);
    expect(isValidPlacePhotoName("places/ChIJ_abc-1/photos/AXCi2Q_x-9=")).toBe(true);
    expect(isValidPlacePhotoName("places/a/photos/b c")).toBe(false);
    expect(isValidPlacePhotoName("places/a/photos/b/extra")).toBe(false);
    expect(isValidPlacePhotoName("https://x")).toBe(false);
    expect(isValidPlacePhotoName(null)).toBe(false);
    expect(isValidPlacePhotoName(`places/${"a".repeat(2000)}/photos/b`)).toBe(false);
  });
});

describe("readClientIp", () => {
  it("cf-connecting-ip → x-forwarded-for 첫 값 → x-real-ip 순으로 읽는다", () => {
    expect(readClientIp(new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(readClientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 10.0.0.1" }))).toBe("2.2.2.2");
    expect(readClientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(readClientIp(new Headers())).toBeNull();
  });
});
