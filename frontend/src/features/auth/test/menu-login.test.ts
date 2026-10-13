import { describe, expect, it } from "vitest";

import { buildLoginNoticeSearchParams } from "../model/oauth";
import { buildMenuLoginPath, resolveLoginReturnPath } from "../model/menu-login";

// issue #181 (QA #21): 메뉴 로그인 후 메뉴를 누른 화면으로 돌아온다.
describe("buildMenuLoginPath", () => {
  it("상황입력 단계 주소(step · rev)를 그대로 next 로 넘긴다", () => {
    expect(buildMenuLoginPath("/course/new/", "?step=region&rev=abcd1234")).toBe(
      `/login?next=${encodeURIComponent("/course/new/?step=region&rev=abcd1234")}`,
    );
  });

  it("쿼리가 없는 화면도 경로를 next 로 넘긴다", () => {
    expect(buildMenuLoginPath("/faq", "")).toBe(`/login?next=${encodeURIComponent("/faq")}`);
  });

  it.each(["/", "/login", "/login/"])("홈 · 로그인 화면(%s)에서는 next 없이 로그인으로 간다", (pathname) => {
    expect(buildMenuLoginPath(pathname, "")).toBe("/login");
  });
});

describe("resolveLoginReturnPath", () => {
  it("로그아웃 직전 상황입력 화면을 돌아올 경로로 돌려준다", () => {
    expect(resolveLoginReturnPath("/course/new/", "?step=purpose&rev=abcd1234")).toBe(
      "/course/new/?step=purpose&rev=abcd1234",
    );
  });

  it("홈에서는 돌아올 경로가 없다", () => {
    expect(resolveLoginReturnPath("/", "")).toBeNull();
  });
});

describe("buildLoginNoticeSearchParams (로그아웃)", () => {
  it("로그아웃 안내와 함께 돌아올 경로를 싣는다", () => {
    const params = new URLSearchParams(
      buildLoginNoticeSearchParams({ notice: "logged_out", next: "/course/new/?step=region&rev=abcd1234" }),
    );
    expect(params.get("notice")).toBe("logged_out");
    expect(params.get("next")).toBe("/course/new/?step=region&rev=abcd1234");
  });

  it("외부 주소 같은 안전하지 않은 경로는 싣지 않는다", () => {
    const params = new URLSearchParams(
      buildLoginNoticeSearchParams({ notice: "logged_out", next: "https://evil.example" }),
    );
    expect(params.get("next")).toBeNull();
  });

  it("돌아올 경로가 없으면 안내만 싣는다", () => {
    expect(buildLoginNoticeSearchParams({ notice: "logged_out", next: null })).toBe("notice=logged_out");
  });
});
