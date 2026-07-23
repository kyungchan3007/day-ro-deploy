import { describe, expect, it } from "vitest";

import { authStatic } from "../../../shared/static/auth";

describe("Login domain", () => {
  it("exposes login copy without embedding oauth implementation details", () => {
    expect(authStatic.login.kakaoButtonLabel).toBe("카카오 로그인");
    expect(authStatic.login.intro.title).toContain("\n");
    expect(authStatic.login.intro.subtitle).toContain("시간, 지역, 목적");
  });

  it("keeps terms links as content metadata", () => {
    expect(authStatic.login.terms.service.label).toBe("서비스 이용약관");
    expect(authStatic.login.terms.privacy.label).toBe("개인정보처리방침");
    expect(authStatic.login.terms.service.href).toBe("#");
    expect(authStatic.login.terms.privacy.href).toBe("#");
  });
});
