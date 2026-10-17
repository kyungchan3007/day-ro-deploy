import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requestLogout } from "../api/logout";
import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";

const logoutSuccessPayload = {
  success: true,
  message: "로그아웃 되었습니다.",
  data: null,
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("requestLogout (feature api)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("calls the BFF logout endpoint with DELETE and validates the response", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(logoutSuccessPayload));

    await expect(requestLogout()).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(
      BFF_ENDPOINTS.authLogout,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("throws when the BFF responds with a non-ok status", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(logoutSuccessPayload, 500));

    await expect(requestLogout()).rejects.toThrow();
  });

  it("throws when the network request fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network_error"));

    await expect(requestLogout()).rejects.toThrow();
  });
});
