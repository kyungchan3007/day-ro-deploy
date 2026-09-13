import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE_NAME } from "../../auth/model/oauth";
import { POST as coursesRoute } from "../../../app/api/courses/route";

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

const saveCoursePayload = {
  success: true,
  message: "요청이 성공했습니다.",
  data: {
    id: "11111111-1111-4111-8111-111111111111",
    title: "역삼 데이트 코스",
    description: "퇴근 후 가볍게 걷는 코스",
    regionName: "역삼동",
    regionCategory: "강남구",
    purpose: "CASUAL_DATE",
    startTime: "18:00:00",
    endTime: "21:30:00",
    places: [
      {
        placeId: "place-1",
        name: "장소-1",
        category: "CAFE",
        address: "서울 성동구 성수이로 10",
        rating: 4.7,
        userRatingCount: 128,
        businessHours: "매일 10:00-22:00",
        latitude: 37.5441,
        longitude: 127.0557,
        photoUrl: "/api/places/photo?name=place-1",
      },
    ],
    createdAt: "2026-08-07T14:30:00",
  },
};

describe("Course save BFF route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("proxies an authenticated course save request to the backend", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentUserPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(saveCoursePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const request = new NextRequest("http://localhost:3000/api/courses", {
      method: "POST",
      body: JSON.stringify({
        title: "역삼 데이트 코스",
        description: "퇴근 후 가볍게 걷는 코스",
        districtId: "3120210",
        purpose: "CASUAL_DATE",
        startTime: "18:00:00",
        endTime: "21:30:00",
        places: [
          {
            placeId: "place-1",
            name: "장소-1",
            category: "CAFE",
            address: "서울 성동구 성수이로 10",
            rating: 4.7,
            userRatingCount: 128,
            businessHours: "매일 10:00-22:00",
            latitude: 37.5441,
            longitude: 127.0557,
            photoUrl: "/api/places/photo?name=place-1",
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
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
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(body).toEqual(saveCoursePayload);
  });

  it("returns 401 when the user tries to save without a session", async () => {
    const request = new NextRequest("http://localhost:3000/api/courses", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
      },
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

  it("rejects an invalid save payload before hitting the backend save API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(currentUserPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const request = new NextRequest("http://localhost:3000/api/courses", {
      method: "POST",
      body: JSON.stringify({
        title: "",
        districtId: "",
        purpose: "DATE",
        startTime: "18:00",
        endTime: "21:30:00",
        places: [],
      }),
      headers: {
        "Content-Type": "application/json",
        Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
      },
    });

    const response = await coursesRoute(request);
    const body = await response.json();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(400);
    expect(body).toEqual({
      success: false,
      message: "잘못된 코스 저장 요청입니다.",
      data: null,
    });
  });
});
