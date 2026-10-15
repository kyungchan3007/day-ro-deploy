import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBackendPlacePhoto } from "./server-place-photo";

/** issue #219: 백엔드 사진 프록시 호출. */
describe("fetchBackendPlacePhoto", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("사진 이름 · 접속 IP 를 넘기고 실패 응답(JSON)도 받도록 Accept 를 보낸다", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchBackendPlacePhoto("places/a/photos/b", "1.2.3.4");

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("http://backend.test/api/places/photo?name=places%2Fa%2Fphotos%2Fb");
    expect(init.headers).toEqual({ Accept: "image/*, application/json", "X-Forwarded-For": "1.2.3.4" });
  });
});
