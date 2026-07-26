import { describe, expect, it } from "vitest";

import {
  buildKakaoAuthorizeUrl,
  buildLoginErrorSearchParams,
  getLoginErrorMessage,
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

  it("preserves backend messages in login error search params", () => {
    expect(
      buildLoginErrorSearchParams({
        error: "oauth_backend_failed",
        message: "카카오 인증에 실패했습니다.",
      }),
    ).toBe(
      "error=oauth_backend_failed&message=%EC%B9%B4%EC%B9%B4%EC%98%A4+%EC%9D%B8%EC%A6%9D%EC%97%90+%EC%8B%A4%ED%8C%A8%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4.",
    );
  });
});
