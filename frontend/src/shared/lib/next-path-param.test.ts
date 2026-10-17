import { describe, expect, it } from "vitest";

import { decodeNextPathParam, encodeNextPathParam } from "./next-path-param";

// issue #200: 운영(Workers) Route Handler 가 쿼리의 %26(&) 을 미리 풀어 next 가 잘리던 문제.
describe("next path param (base64url)", () => {
  it("& · ? · 한글이 있는 경로도 &·%·/ 없는 값으로 감싸고 그대로 되돌린다", () => {
    const path = "/course/new/?step=purpose&rev=abc123&q=서촌";
    const encoded = encodeNextPathParam(path);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeNextPathParam(encoded)).toBe(path);
  });

  it("Workers 처럼 쿼리를 한 번 더 풀어도 값이 바뀌지 않는다", () => {
    const encoded = encodeNextPathParam("/course/new/?step=region&rev=zz");
    const url = new URL(`http://x/api/auth/kakao/start?next=${decodeURIComponent(encoded)}`);

    expect(decodeNextPathParam(url.searchParams.get("next"))).toBe("/course/new/?step=region&rev=zz");
  });

  it("/ 로 시작하는 이전 평문 형식은 그대로 받는다", () => {
    expect(decodeNextPathParam("/saved/abc")).toBe("/saved/abc");
  });

  it.each([null, undefined, "", "not base64!", "%2Fsaved", "a".repeat(5000)])(
    "형식이 틀리면 null (%s)",
    (value) => {
      expect(decodeNextPathParam(value as string | null | undefined)).toBeNull();
    },
  );

  it("깨진 UTF-8 은 null", () => {
    expect(decodeNextPathParam("_-_-")).toBeNull();
  });
});
