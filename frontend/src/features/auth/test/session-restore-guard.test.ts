import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "../model/oauth";

const cookieValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieValues.has(name) ? { name, value: cookieValues.get(name) } : undefined),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const { requireAuthSessionForServerComponent } = await import(
  "../../../shared/api/server-auth-session"
);

const currentMemberPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    provider: "KAKAO",
    nickname: "dayro-user",
    email: "user@example.com",
    name: null,
    profileImage: null,
    birthday: "0727",
    joinedAt: "2026-07-27T10:00:00",
  },
};

describe("requireAuthSessionForServerComponent (issue #146)", () => {
  beforeEach(() => {
    cookieValues.clear();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends refresh-only sessions to the restore route with the original path", async () => {
    cookieValues.set(REFRESH_TOKEN_COOKIE_NAME, "refresh-token");

    await expect(requireAuthSessionForServerComponent("/saved/abc")).rejects.toThrow(
      "REDIRECT:/api/auth/restore/?next=%2Fsaved%2Fabc",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("sends users without any session to login", async () => {
    await expect(requireAuthSessionForServerComponent("/mypage")).rejects.toThrow(
      "REDIRECT:/login?next=%2Fmypage",
    );
  });

  it("sends users to login (not restore) when the access token is rejected, so restore never loops", async () => {
    cookieValues.set(ACCESS_TOKEN_COOKIE_NAME, "expired-access");
    cookieValues.set(REFRESH_TOKEN_COOKIE_NAME, "refresh-token");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: "만료", data: null }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(requireAuthSessionForServerComponent("/mypage")).rejects.toThrow(
      "REDIRECT:/login?next=%2Fmypage",
    );
  });

  it("returns the signed-in user when the access token is valid", async () => {
    cookieValues.set(ACCESS_TOKEN_COOKIE_NAME, "access-token");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(currentMemberPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const session = await requireAuthSessionForServerComponent("/mypage");

    expect(session.authenticated).toBe(true);
    expect(session.user.nickname).toBe("dayro-user");
  });
});
