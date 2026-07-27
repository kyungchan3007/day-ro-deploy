import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import { authSessionSchema } from "../../../shared/api/openapi/dayro.openapi";
import type { AuthSession } from "../model/session";

/**
 * 현재 브라우저 세션을 조회한다.
 *
 * 홈 드로어처럼 루트 페이지에서도 로그인 상태를 표시해야 하므로,
 * 외부 백엔드가 아니라 BFF `/api/auth/me` 만 호출해 세션 복구/쿠키 갱신을 서버에 위임한다.
 */
export async function requestAuthSession(): Promise<AuthSession> {
  const response = await fetch(BFF_ENDPOINTS.authMe, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("auth_session_failed");
  }

  return authSessionSchema.parse(await response.json());
}
