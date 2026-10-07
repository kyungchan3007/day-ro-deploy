import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BackendApiError,
  bffErrorResponse,
  isBackendAuthRejection,
  readBackendJson,
  toBackendApiError,
  toBffErrorStatus,
} from "./backend-error";
import { retrySituation, submitSituation } from "./server-situation";

const apiFail = (status: number, message: string) =>
  new Response(JSON.stringify({ success: false, message, data: null }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("BFF error rules (issue #139 S8)", () => {
  it.each([
    [400, 400],
    [401, 401],
    [403, 403],
    [404, 404],
    [409, 409],
    [429, 429],
    [503, 503],
    [500, 502],
    [502, 502],
    [504, 502],
  ])("maps backend %i to BFF %i", (backend, bff) => {
    expect(toBffErrorStatus(backend)).toBe(bff);
  });

  it("reads non-JSON bodies as null instead of throwing parse errors", async () => {
    expect(await readBackendJson(new Response("<html>502 Bad Gateway</html>"))).toBeNull();
    expect(await readBackendJson(new Response(""))).toBeNull();
    expect(await readBackendJson(apiFail(400, "x"))).toEqual({ success: false, message: "x", data: null });
  });

  it("uses backend copy for 4xx·503 and the fallback for other 5xx or non-JSON bodies", () => {
    const fallback = "기본 문구";
    expect(toBackendApiError(apiFail(429, "한도 초과"), { message: "한도 초과" }, fallback).message).toBe("한도 초과");
    expect(toBackendApiError(apiFail(503, "AI 실패"), { message: "AI 실패" }, fallback).message).toBe("AI 실패");
    expect(toBackendApiError(apiFail(500, "서버 내부 오류"), { message: "서버 내부 오류" }, fallback).message).toBe(fallback);
    expect(toBackendApiError(new Response("<html/>", { status: 404 }), null, fallback).message).toBe(fallback);
  });

  it("returns 502 with the fallback and never leaks raw exception text for unexpected errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = bffErrorResponse(new TypeError("fetch failed: connect ECONNREFUSED 10.0.0.5:8080"), "기본 문구", []);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ success: false, message: "기본 문구", data: [] });
    vi.restoreAllMocks();
  });

  it("treats only 400·401·403 backend errors as auth rejection", () => {
    expect(isBackendAuthRejection(new BackendApiError(401, "x"))).toBe(true);
    expect(isBackendAuthRejection(new BackendApiError(400, "x"))).toBe(true);
    expect(isBackendAuthRejection(new BackendApiError(503, "x"))).toBe(false);
    expect(isBackendAuthRejection(new TypeError("fetch failed"))).toBe(false);
  });
});

describe("situation BFF routes keep backend status (issue #139 S8)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const situation = { startTime: "18:00:00", endTime: "21:00:00", districtId: "1", purpose: "CASUAL_DATE" } as const;

  it.each([
    [429, "오늘의 코스 추천 요청 한도를 모두 사용했어요. 내일 다시 이용해주세요.", 429],
    [404, "조건에 맞는 장소를 찾지 못했어요. 다시 선택해주세요.", 404],
    [503, "코스를 불러오지 못했어요. 잠시 후 다시 시도해주세요.", 503],
  ])("course creation: backend %i passes through with backend copy", async (status, message, bffStatus) => {
    vi.mocked(fetch).mockResolvedValue(apiFail(status, message));
    const { POST } = await import("../../app/api/situations/route");
    const { NextRequest } = await import("next/server");

    const response = await POST(new NextRequest("http://localhost:3000/api/situations", {
      method: "POST",
      body: JSON.stringify(situation),
    }));

    expect(response.status).toBe(bffStatus);
    expect((await response.json()).message).toBe(message);
  });

  it("course creation: an HTML 500 from a proxy becomes 502 with fixed copy", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("<html>Internal Server Error</html>", { status: 500 }));
    await expect(submitSituation(situation)).rejects.toMatchObject({ status: 500, message: "추천 코스를 불러오지 못했습니다." });
  });

  it("retry: backend 429 retry limit keeps its status", async () => {
    vi.mocked(fetch).mockResolvedValue(apiFail(429, "다른 코스 보기를 모두 사용했어요."));
    await expect(retrySituation("request-1")).rejects.toMatchObject({ status: 429, message: "다른 코스 보기를 모두 사용했어요." });
  });
});

describe("session resolution distinguishes outage from token rejection (issue #139 S8)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function meWith(cookie: string) {
    const { GET } = await import("../../app/api/auth/me/route");
    const { NextRequest } = await import("next/server");
    return GET(new NextRequest("http://localhost:3000/api/auth/me", { headers: { cookie } }));
  }

  it("keeps auth cookies when the backend is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));

    const response = await meWith("dayro_access_token=a; dayro_refresh_token=r");

    expect(await response.json()).toEqual({ authenticated: false, user: null });
    expect(response.cookies.get("dayro_access_token")).toBeUndefined();
    expect(response.cookies.get("dayro_refresh_token")).toBeUndefined();
  });

  it("clears auth cookies when both tokens are rejected", async () => {
    vi.mocked(fetch).mockImplementation(async () => apiFail(401, "유효하지 않은 토큰입니다."));

    const response = await meWith("dayro_access_token=a; dayro_refresh_token=r");

    expect(await response.json()).toEqual({ authenticated: false, user: null });
    expect(response.cookies.get("dayro_access_token")?.value).toBe("");
    expect(response.cookies.get("dayro_refresh_token")?.value).toBe("");
  });
});
