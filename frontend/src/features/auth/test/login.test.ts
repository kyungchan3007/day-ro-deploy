import { describe, expect, it } from "vitest";

import {
  buildKakaoAuthorizeUrl,
  buildLoginErrorSearchParams,
  buildLoginNoticeSearchParams,
  getLoginErrorMessage,
  getLoginNoticeMessage,
} from "../model/oauth";
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
    expect(authStatic.login.terms.service.href).toBe("/terms");
    expect(authStatic.login.terms.privacy.href).toBe("/privacy");
  });

  it("builds the kakao authorize url with oauth state", () => {
    expect(
      buildKakaoAuthorizeUrl({
        clientId: "kakao-client-id",
        redirectUri: "http://localhost:3000/api/auth/kakao/callback",
        state: "securestate123",
      }),
    ).toBe(
      "https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=kakao-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fkakao%2Fcallback&state=securestate123",
    );
  });

  it("maps oauth failures to user-facing messages", () => {
    expect(getLoginErrorMessage("oauth_state_mismatch")).toContain(
      "로그인 검증",
    );
    expect(getLoginErrorMessage("unknown-error")).toContain(
      "로그인을 완료하지 못했어요",
    );
  });

  it("never puts free-text messages in login error search params (issue #139 S4)", () => {
    const params = buildLoginErrorSearchParams({
      error: "oauth_backend_failed",
      // 타입 밖 값이 들어와도 URL 에 실리지 않아야 한다.
      ...({ message: "카카오 인증에 실패했습니다." } as object),
    });

    expect(params).toBe("error=oauth_backend_failed");
    expect(params).not.toContain("message");
  });

  it("maps only own error/notice keys, never prototype keys (issue #139)", () => {
    for (const key of ["__proto__", "constructor", "toString", "hasOwnProperty"]) {
      expect(typeof getLoginErrorMessage(key)).toBe("string");
      expect(getLoginErrorMessage(key)).toContain("로그인을 완료하지 못했어요");
      expect(getLoginNoticeMessage(key)).toBeNull();
    }
  });

  it("maps login notices to controlled success copy only", () => {
    expect(getLoginNoticeMessage("logged_out")).toBe("로그아웃 되었어요.");
    expect(getLoginNoticeMessage("unknown-notice")).toBeNull();
  });

  it("builds login notice search params without exposing raw message text", () => {
    expect(
      buildLoginNoticeSearchParams({
        notice: "logged_out",
      }),
    ).toBe("notice=logged_out");
  });
});
