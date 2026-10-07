import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import { withdrawResponseSchema } from "../../../shared/api/openapi/dayro.openapi";

/**
 * 현재 세션 회원탈퇴 (features/auth BFF 호출).
 *
 * 외부 백엔드가 아니라 BFF endpoint(`/api/auth/withdraw`)만 호출한다.
 * 세션 쿠키 정리는 BFF/서버 계층 책임이므로 여기서는 다루지 않는다.
 * 응답은 공용 계약(withdrawResponseSchema)으로 검증하고, 실패 시 throw 한다.
 */
export async function requestWithdraw(): Promise<void> {
  const response = await fetch(BFF_ENDPOINTS.authWithdraw, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("withdraw_failed");
  }

  withdrawResponseSchema.parse(await response.json());
}
