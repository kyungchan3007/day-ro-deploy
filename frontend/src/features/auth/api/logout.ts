import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import { logoutResponseSchema } from "../../../shared/api/openapi/dayro.openapi";

/**
 * 현재 세션 로그아웃 (features/auth BFF 호출).
 *
 * 외부 백엔드가 아니라 BFF endpoint(`/api/auth/logout`)만 호출한다.
 * 토큰·쿠키 처리는 BFF/서버 계층 책임이므로 여기서는 다루지 않는다.
 * 응답은 공용 계약(logoutResponseSchema)으로 검증하고, 실패 시 throw 한다.
 */
export async function requestLogout(): Promise<void> {
  const response = await fetch(BFF_ENDPOINTS.authLogout, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("logout_failed");
  }

  logoutResponseSchema.parse(await response.json());
}
