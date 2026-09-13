import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE_NAME } from "../../auth/model/oauth";
import {
  DELETE as deleteCourseRoute,
  GET as courseDetailRoute,
  PUT as updateCourseRoute,
} from "../../../app/api/courses/[id]/route";

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

const savedCourseDetailPayload = {
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

const deletedCoursePayload = {
  success: true,
  message: "코스가 삭제되었습니다.",
  data: null,
};

describe("Saved course detail BFF route", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("proxies an authenticated saved course detail request to the backend", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentUserPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(savedCourseDetailPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const request = new NextRequest(
      "http://localhost:3000/api/courses/11111111-1111-4111-8111-111111111111",
      {
        method: "GET",
        headers: {
          Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
        },
      },
    );

    const response = await courseDetailRoute(request, {
      params: Promise.resolve({
        id: "11111111-1111-4111-8111-111111111111",
      }),
    });
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
      new URL(
        "/api/courses/11111111-1111-4111-8111-111111111111",
        "http://localhost:8080",
      ),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(body).toEqual(savedCourseDetailPayload);
  });

  it("proxies an authenticated saved course update request to the backend", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentUserPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(savedCourseDetailPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const request = new NextRequest(
      "http://localhost:3000/api/courses/11111111-1111-4111-8111-111111111111",
      {
        method: "PUT",
        body: JSON.stringify({
          title: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
          placeIds: ["place-1"],
        }),
        headers: {
          "Content-Type": "application/json",
          Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
        },
      },
    );

    const response = await updateCourseRoute(request, {
      params: Promise.resolve({
        id: "11111111-1111-4111-8111-111111111111",
      }),
    });
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
      new URL(
        "/api/courses/11111111-1111-4111-8111-111111111111",
        "http://localhost:8080",
      ),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
        body: JSON.stringify({
          title: "역삼 데이트 코스",
          description: "퇴근 후 가볍게 걷는 코스",
          placeIds: ["place-1"],
        }),
      }),
    );
    expect(response.status).toBe(200);
    expect(body).toEqual(savedCourseDetailPayload);
  });

  it("proxies one authenticated saved course delete request to the backend", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentUserPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(deletedCoursePayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const request = new NextRequest(
      "http://localhost:3000/api/courses/11111111-1111-4111-8111-111111111111",
      {
        method: "DELETE",
        headers: {
          Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
        },
      },
    );

    const response = await deleteCourseRoute(request, {
      params: Promise.resolve({
        id: "11111111-1111-4111-8111-111111111111",
      }),
    });

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      new URL(
        "/api/courses/11111111-1111-4111-8111-111111111111",
        "http://localhost:8080",
      ),
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer access-token",
        },
        cache: "no-store",
      },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(deletedCoursePayload);
  });

  it("preserves COURSE_NOT_FOUND delete status and message", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(currentUserPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            message: "저장한 코스를 찾을 수 없습니다.",
            data: null,
          }),
          { status: 404, headers: { "Content-Type": "application/json" } },
        ),
      );

    const request = new NextRequest("http://localhost:3000/api/courses/missing", {
      method: "DELETE",
      headers: { Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token` },
    });
    const response = await deleteCourseRoute(request, {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "저장한 코스를 찾을 수 없습니다.",
      data: null,
    });
  });
});
