import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE_NAME } from "../../auth/model/oauth";
import { GET as coursesRoute } from "../../../app/api/courses/route";

const currentUserPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    provider: "KAKAO",
    nickname: "테스트",
    email: "test@example.com",
    name: "테스트",
    profileImage: null,
    birthday: null,
    joinedAt: "2026-08-01T00:00:00",
  },
};

const savedCoursesPayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "역삼 데이트 코스",
      description: "퇴근 후 가볍게 걷는 코스",
      regionName: "역삼동",
      purpose: "CASUAL_DATE",
      createdAt: "2026-08-07T14:30:00",
      placeCount: 4,
      thumbnailUrl: "/api/places/photo?name=place-1",
    },
  ],
};

describe("Saved courses BFF route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("proxies an authenticated saved courses request to the backend", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentUserPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(savedCoursesPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const request = new NextRequest("http://localhost:3000/api/courses", {
      method: "GET",
      headers: {
        Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
      },
    });

    const response = await coursesRoute(request);
    const body = await response.json();

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      new URL("/api/auth/me", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        headers: {
          Authorization: "Bearer access-token",
        },
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL("/api/courses", "http://localhost:8080"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(body).toEqual(savedCoursesPayload);
  });

  it("returns 401 when the user requests saved courses without a session", async () => {
    const request = new NextRequest("http://localhost:3000/api/courses", {
      method: "GET",
    });

    const response = await coursesRoute(request);
    const body = await response.json();

    expect(fetch).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    expect(body).toEqual({
      success: false,
      message: "로그인이 필요합니다.",
      data: null,
    });
  });
});
