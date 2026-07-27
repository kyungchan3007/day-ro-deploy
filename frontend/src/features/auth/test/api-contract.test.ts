import { describe, expect, it } from "vitest";
import {
  authOpenApi,
  authResponseSchema,
  kakaoLoginRequestSchema,
  logoutResponseSchema,
  refreshRequestSchema,
} from "../../../shared/api/openapi/dayro.openapi";

describe("Auth API contracts", () => {
  it("keeps auth endpoint contracts in the shared openapi module", () => {
    expect(authOpenApi.paths.kakaoToken).toBe("/api/auth/kakao/token");
    expect(authOpenApi.paths.refresh).toBe("/api/auth/refresh");
    expect(authOpenApi.paths.logout).toBe("/api/auth/logout");
  });

  it("parses auth login and refresh requests", () => {
    expect(
      kakaoLoginRequestSchema.parse({
        code: "kakao-authorization-code",
      }),
    ).toEqual({
      code: "kakao-authorization-code",
    });

    expect(
      refreshRequestSchema.parse({
        refreshToken: "refresh-token",
      }),
    ).toEqual({
      refreshToken: "refresh-token",
    });
  });

  it("parses the auth success response wrapper", () => {
    expect(
      authResponseSchema.parse({
        success: true,
        message: "요청이 성공했습니다.",
        data: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
          isNewUser: false,
        },
      }),
    ).toEqual({
      success: true,
      message: "요청이 성공했습니다.",
      data: {
        accessToken: "access-token",
        refreshToken: "refresh-token",
        isNewUser: false,
      },
    });
  });

  it("parses the logout void response wrapper", () => {
    expect(
      logoutResponseSchema.parse({
        success: true,
        message: "로그아웃 되었습니다.",
        data: null,
      }),
    ).toEqual({
      success: true,
      message: "로그아웃 되었습니다.",
      data: null,
    });
  });
});
