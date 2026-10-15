import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { ACCESS_TOKEN_COOKIE_NAME } from "../../../shared/api/auth-cookies";
import { POST } from "./route";

const valid = { subject: "저장 문의", body: "저장이 안 돼요.", email: "user@dayro.dev" };

function request(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/inquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

/** issue #224: 문의 BFF. */
describe("POST /api/inquiries", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("입력이 계약에 안 맞으면 백엔드로 보내지 않고 400", async () => {
    const response = await POST(request({ ...valid, email: "x" }));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("접속 IP · 로그인 토큰을 함께 전달하고 성공 응답을 계약대로 내려준다", async () => {
    fetchMock.mockResolvedValue(
      Response.json({
        success: true,
        message: "문의가 접수되었습니다.",
        data: { inquiryId: "3f9deddc-12a7-41a1-8102-00b23591e67d" },
      }),
    );
    const response = await POST(
      request(valid, { "cf-connecting-ip": "1.2.3.4", cookie: `${ACCESS_TOKEN_COOKIE_NAME}=token-1` }),
    );
    expect(response.status).toBe(200);
    expect((await response.json()).data.inquiryId).toBe("3f9deddc-12a7-41a1-8102-00b23591e67d");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://backend.test/api/inquiries");
    expect(init.headers).toMatchObject({ Authorization: "Bearer token-1", "X-Forwarded-For": "1.2.3.4" });
    expect(JSON.parse(String(init.body))).toEqual(valid);
  });

  it("비회원은 토큰 없이 보낸다", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ success: true, message: "ok", data: { inquiryId: "3f9deddc-12a7-41a1-8102-00b23591e67d" } }),
    );
    await POST(request(valid));
    const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("백엔드 429 · 400 은 상태 그대로, 응답 계약 불일치 · 5xx 는 502", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ success: false, message: "요청이 너무 많아요.", data: null }, { status: 429 }));
    expect((await POST(request(valid))).status).toBe(429);
    fetchMock.mockResolvedValueOnce(Response.json({ success: false, message: "must not be blank", data: null }, { status: 400 }));
    expect((await POST(request(valid))).status).toBe(400);
    fetchMock.mockResolvedValueOnce(Response.json({ success: true, message: "ok", data: { inquiryId: "1" } }));
    expect((await POST(request(valid))).status).toBe(502);
    fetchMock.mockResolvedValueOnce(new Response("oops", { status: 500 }));
    expect((await POST(request(valid))).status).toBe(502);
  });
});
