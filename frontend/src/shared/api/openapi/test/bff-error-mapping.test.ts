import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { $ZodError } from "zod/v4/core";
import { POST } from "../../../../app/api/situations/route";
import { saveCourseFromRequest, updateCourseFromRequest } from "../../server-course";
import { submitSituation } from "../../server-situation";
import { resolveAuthSessionFromRequest } from "../../server-auth-session";
import { saveCourseWithBackendAccessToken, updateCourseWithBackendAccessToken } from "../../server-course-client";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../../../features/auth/model/oauth";
import { courseSaveRequestSchema, courseUpdateRequestSchema, situationInputRequestSchema } from "../dayro.openapi";

vi.mock("../../server-situation", () => ({ submitSituation: vi.fn() }));
vi.mock("../../server-auth-session", () => ({ resolveAuthSessionFromRequest: vi.fn() }));
vi.mock("../../server-course-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../server-course-client")>(),
  saveCourseWithBackendAccessToken: vi.fn(),
  updateCourseWithBackendAccessToken: vi.fn(),
}));

const situation = { startTime: "12:00:00", endTime: "14:00:00", districtId: "1", purpose: "FRIENDS" };
const save = { ...situation, title: "Course", places: [{ placeId: "p1", name: "Cafe" }] };
const update = { title: "Course", placeIds: ["p1"] };
const routes = [
  { name: "situation", call: POST, payload: situation, schema: situationInputRequestSchema, upstream: vi.mocked(submitSituation), message: "잘못된 상황 입력 요청입니다." },
  { name: "save", call: saveCourseFromRequest, payload: save, schema: courseSaveRequestSchema, upstream: vi.mocked(saveCourseWithBackendAccessToken), message: "잘못된 코스 저장 요청입니다." },
  { name: "update", call: (request: NextRequest) => updateCourseFromRequest(request, "id"), payload: update, schema: courseUpdateRequestSchema, upstream: vi.mocked(updateCourseWithBackendAccessToken), message: "잘못된 코스 수정 요청입니다." },
];
const request = (payload: unknown) => new NextRequest("http://example.test/api/courses", {
  method: "POST", body: JSON.stringify(payload), headers: { Cookie: `${ACCESS_TOKEN_COOKIE_NAME}=token` },
});

beforeEach(() => {
  vi.mocked(resolveAuthSessionFromRequest).mockResolvedValue({ authenticated: true, user: {
    provider: "KAKAO", nickname: null, email: null, name: null, profileImage: null, birthday: null, joinedAt: "today",
  } });
});
afterEach(() => vi.resetAllMocks());

describe.each(routes)("$name BFF error mapping", ({ call, payload, schema, upstream, message }) => {
  it("preserves request validation HTTP 400 and response body", async () => {
    const response = await call(request({}));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, message, data: null });
    expect(upstream).not.toHaveBeenCalled();
  });
  it("preserves upstream contract error HTTP 400 (known follow-up)", async () => {
    const invalid = schema.safeParse({});
    if (invalid.success) throw new Error("Expected invalid fixture");
    expect(invalid.error).toBeInstanceOf($ZodError);
    expect(invalid.error).toBeInstanceOf(Error);
    upstream.mockRejectedValueOnce(invalid.error);
    const response = await call(request(payload));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, message, data: null });
  });
  it("keeps ordinary upstream failures mapped to HTTP 502", async () => {
    upstream.mockRejectedValueOnce(new Error("upstream failed"));
    expect((await call(request(payload))).status).toBe(502);
  });
});
