import { describe, expect, it } from "vitest";
import {
  authOpenApi,
  authSessionSchema,
  authResponseSchema,
  kakaoLoginRequestSchema,
  logoutResponseSchema,
  refreshRequestSchema,
} from "../../../shared/api/openapi/dayro.openapi";

describe("Auth API contracts", () => {
  it("keeps auth endpoint contracts in the shared openapi module", () => {
    expect(authOpenApi.paths.kakaoToken).toBe("/api/auth/kakao/token");
    expect(authOpenApi.paths.me).toBe("/api/auth/me");
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

  it("parses the auth session response", () => {
    expect(
      authSessionSchema.parse({
        authenticated: true,
        user: {
          provider: "KAKAO",
          nickname: "dayro-user",
          email: "user@example.com",
          name: null,
          profileImage: null,
          birthday: "0727",
          joinedAt: "2026-07-27T10:00:00",
        },
      }),
    ).toEqual({
      authenticated: true,
      user: {
        provider: "KAKAO",
        nickname: "dayro-user",
        email: "user@example.com",
        name: null,
        profileImage: null,
        birthday: "0727",
        joinedAt: "2026-07-27T10:00:00",
      },
    });
  });
});
