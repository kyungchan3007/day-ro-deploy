import "server-only";

import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "../../../shared/api/auth-cookies";
import { GUEST_BROWSE_COOKIE_NAME, resolveRootEntry, type RootEntry } from "../model/root-entry";

/** `/` 요청 쿠키로 시작 화면 · 홈 중 무엇을 보여줄지 정한다. */
export async function getRootEntry(): Promise<RootEntry> {
  const store = await cookies();
  return resolveRootEntry({
    hasAccessToken: Boolean(store.get(ACCESS_TOKEN_COOKIE_NAME)?.value),
    hasRefreshToken: Boolean(store.get(REFRESH_TOKEN_COOKIE_NAME)?.value),
    guestBrowse: store.get(GUEST_BROWSE_COOKIE_NAME)?.value,
  });
}
