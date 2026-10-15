import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ fetchPhoto: vi.fn() }));

vi.mock("../../../../shared/api/server-place-photo", () => ({
  fetchBackendPlacePhoto: mocks.fetchPhoto,
}));

import { GET } from "./route";

function request(name: string | null, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/places/photo");
  if (name != null) url.searchParams.set("name", name);
  return new NextRequest(url, { headers });
}

/** issue #219 (QA #8): 장소 사진 BFF. */
describe("GET /api/places/photo", () => {
  beforeEach(() => mocks.fetchPhoto.mockReset());

  it("사진 이름이 아니면 백엔드로 보내지 않고 400", async () => {
    const response = await GET(request("../secret"));
    expect(response.status).toBe(400);
    expect(mocks.fetchPhoto).not.toHaveBeenCalled();
  });

  it("접속 IP 와 함께 백엔드로 전달하고 이미지 · 캐시 헤더를 그대로 내려준다", async () => {
    mocks.fetchPhoto.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "max-age=604800, public" },
      }),
    );
    const response = await GET(request("places/a/photos/b", { "cf-connecting-ip": "1.2.3.4" }));
    expect(mocks.fetchPhoto).toHaveBeenCalledWith("places/a/photos/b", "1.2.3.4");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toBe("max-age=604800, public");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("백엔드 한도 초과 429 · 없음 404 는 그대로, 그 밖 실패 · 이미지가 아니면 502 (캐시 안 함)", async () => {
    mocks.fetchPhoto.mockResolvedValueOnce(new Response(null, { status: 429 }));
    expect((await GET(request("places/a/photos/b"))).status).toBe(429);
    mocks.fetchPhoto.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect((await GET(request("places/a/photos/b"))).status).toBe(404);
    mocks.fetchPhoto.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const failed = await GET(request("places/a/photos/b"));
    expect(failed.status).toBe(502);
    expect(failed.headers.get("cache-control")).toBe("no-store");
    mocks.fetchPhoto.mockResolvedValueOnce(new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } }));
    expect((await GET(request("places/a/photos/b"))).status).toBe(502);
    mocks.fetchPhoto.mockRejectedValueOnce(new Error("network"));
    expect((await GET(request("places/a/photos/b"))).status).toBe(502);
  });
});
