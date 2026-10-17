import "server-only";

import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from "../../../shared/api/auth-cookies";
import { resolveRootEntry, type RootEntry } from "../model/root-entry";

/** `/` 요청 쿠키로 회원 · 비회원을 나눈다. */
export async function getRootEntry(): Promise<RootEntry> {
  const store = await cookies();
  return resolveRootEntry({
    hasAccessToken: Boolean(store.get(ACCESS_TOKEN_COOKIE_NAME)?.value),
    hasRefreshToken: Boolean(store.get(REFRESH_TOKEN_COOKIE_NAME)?.value),
  });
}
