import "server-only";

import { getBackendBaseUrl } from "./backend-base-url";
import { PLACE_PHOTO_PATH } from "./place-photo";

/**
 * 백엔드 장소 사진 프록시(`GET /api/places/photo`)를 호출한다 (issue #219).
 * 접속 IP 를 X-Forwarded-For 로 넘겨, 백엔드의 IP당 분당 제한이 Workers IP 가 아니라 사용자 기준으로 걸리게 한다.
 */
export function fetchBackendPlacePhoto(name: string, clientIp: string | null): Promise<Response> {
  const url = new URL(PLACE_PHOTO_PATH, getBackendBaseUrl());
  url.searchParams.set("name", name);
  return fetch(url, {
    method: "GET",
    headers: {
      // 실패 응답은 JSON 이라 함께 받는다. image/* 만 보내면 백엔드가 404 · 429 를 500 으로 바꿔 보낸다.
      Accept: "image/*, application/json",
      ...(clientIp ? { "X-Forwarded-For": clientIp } : {}),
    },
    cache: "no-store",
  });
}
