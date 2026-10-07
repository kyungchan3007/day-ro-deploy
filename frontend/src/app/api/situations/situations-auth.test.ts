import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  retry: vi.fn(),
}));

vi.mock("../../../shared/api/server-situation", () => ({
  submitSituation: mocks.submit,
  retrySituation: mocks.retry,
}));

import { ACCESS_TOKEN_COOKIE_NAME } from "../../../shared/api/auth-cookies";
import { POST as submitRoute } from "./route";
import { POST as retryRoute } from "./[requestId]/retry/route";

const payload = {
  startTime: "18:00:00",
  endTime: "21:00:00",
  districtId: "3120006",
  purpose: "CASUAL_DATE",
};

function request(url: string, cookie?: string, body?: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie: `${ACCESS_TOKEN_COOKIE_NAME}=${cookie}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("situation BFF forwards the login token (issue #135)", () => {
  beforeEach(() => {
    mocks.submit.mockReset().mockResolvedValue({ success: true });
    mocks.retry.mockReset().mockResolvedValue({ success: true });
  });

  it("passes the access token cookie to course creation", async () => {
    await submitRoute(request("http://localhost:3000/api/situations", "member-token", payload));

    expect(mocks.submit).toHaveBeenCalledWith(payload, { accessToken: "member-token" });
  });

  it("sends no token for anonymous course creation", async () => {
    await submitRoute(request("http://localhost:3000/api/situations", undefined, payload));

    expect(mocks.submit).toHaveBeenCalledWith(payload, { accessToken: null });
  });

  it("passes the access token cookie to retry and none when anonymous", async () => {
    const params = Promise.resolve({ requestId: "request-1" });
    await retryRoute(request("http://localhost:3000/api/situations/request-1/retry", "member-token"), {
      params,
    });
    await retryRoute(request("http://localhost:3000/api/situations/request-1/retry"), { params });

    expect(mocks.retry).toHaveBeenNthCalledWith(1, "request-1", { accessToken: "member-token" });
    expect(mocks.retry).toHaveBeenNthCalledWith(2, "request-1", { accessToken: null });
  });
});
