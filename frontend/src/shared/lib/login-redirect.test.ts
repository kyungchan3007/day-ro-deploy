import { describe, expect, it } from "vitest";

import { buildStartScreenPath } from "./login-redirect";

describe("buildStartScreenPath (issue #181 · #244)", () => {
  it("돌아갈 화면이 없으면 시작 화면만", () => {
    expect(buildStartScreenPath(null)).toBe("/");
    expect(buildStartScreenPath(undefined)).toBe("/");
    expect(buildStartScreenPath("")).toBe("/");
  });

  it("로그아웃 직전 화면(쿼리 포함)을 next 로 넘긴다", () => {
    const path = buildStartScreenPath("/course/new/?step=region&rev=abcd1234");
    expect(path).toBe("/?next=%2Fcourse%2Fnew%2F%3Fstep%3Dregion%26rev%3Dabcd1234");
    expect(new URL(path, "https://day-ro.com").searchParams.get("next")).toBe("/course/new/?step=region&rev=abcd1234");
  });
});
