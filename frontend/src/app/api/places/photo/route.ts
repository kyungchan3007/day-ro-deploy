import { NextRequest, NextResponse } from "next/server";

import { readClientIp } from "../../../../shared/api/client-ip";
import { isValidPlacePhotoName } from "../../../../shared/api/place-photo";
import { fetchBackendPlacePhoto } from "../../../../shared/api/server-place-photo";

const DEFAULT_CACHE_CONTROL = "public, max-age=604800";

function noImage(status: number) {
  return new NextResponse(null, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * 장소 사진 BFF endpoint (QA #8, issue #219).
 * 백엔드 프록시로 전달해 이미지를 그대로 내려준다. 사진 이름이 아니면 백엔드로 보내지 않는다.
 * 백엔드 한도 초과(429) · 없음(404)은 상태 그대로, 그 밖 실패는 502 — 화면은 기본 이미지로 대체한다.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!isValidPlacePhotoName(name)) {
    return noImage(400);
  }

  try {
    const response = await fetchBackendPlacePhoto(name, readClientIp(request.headers));
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      return noImage(response.status === 429 || response.status === 404 ? response.status : 502);
    }
    if (!contentType.startsWith("image/")) {
      return noImage(502);
    }
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // 사진 이름마다 이미지가 고정이라 백엔드와 같은 7일 브라우저 캐시를 유지한다.
        "Cache-Control": response.headers.get("cache-control") ?? DEFAULT_CACHE_CONTROL,
      },
    });
  } catch {
    return noImage(502);
  }
}
