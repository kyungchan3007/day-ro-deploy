import { describe, expect, it } from "vitest";

import { readClientIp } from "./client-ip";

/** BFF 공용 접속 IP 읽기(issue #224). place-photo.test.ts 에서 옮김(issue #229). */
describe("readClientIp", () => {
  it("cf-connecting-ip → x-forwarded-for 첫 값 → x-real-ip 순으로 읽는다", () => {
    expect(readClientIp(new Headers({ "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" }))).toBe("1.1.1.1");
    expect(readClientIp(new Headers({ "x-forwarded-for": "2.2.2.2, 10.0.0.1" }))).toBe("2.2.2.2");
    expect(readClientIp(new Headers({ "x-real-ip": "3.3.3.3" }))).toBe("3.3.3.3");
    expect(readClientIp(new Headers())).toBeNull();
  });
});
