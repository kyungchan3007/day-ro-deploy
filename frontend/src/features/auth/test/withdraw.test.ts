import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestWithdraw } from "../api/withdraw";
import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";

const withdrawSuccessPayload = {
  success: true,
  message: "회원 탈퇴가 완료되었습니다.",
  data: null,
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("requestWithdraw (feature api)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls the BFF withdraw endpoint with DELETE and validates the response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(withdrawSuccessPayload));

    await expect(requestWithdraw()).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      BFF_ENDPOINTS.authWithdraw,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws when the BFF responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(withdrawSuccessPayload, 500));

    await expect(requestWithdraw()).rejects.toThrow();
  });

  it("throws when the network request fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network_error"));

    await expect(requestWithdraw()).rejects.toThrow();
  });
});
