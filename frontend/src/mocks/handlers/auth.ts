import { http, HttpResponse } from "msw";

import type {
  AuthSession,
  LogoutResponse,
  WithdrawResponse,
} from "@/shared/api/openapi/dayro.openapi";

const guestSession: AuthSession = {
  authenticated: false,
  user: null,
};

const logoutSuccess: LogoutResponse = {
  success: true,
  message: "로그아웃 되었습니다.",
  data: null,
};

const withdrawSuccess: WithdrawResponse = {
  success: true,
  message: "회원 탈퇴가 완료되었습니다.",
  data: null,
};

/**
 * auth BFF 기본 mock.
 *
 * Storybook이나 브라우저 mock 환경에서 인증 의존 UI가 붙을 때
 * 최소한의 guest session / logout success 계약을 안정적으로 제공한다.
 */
export const authHandlers = [
  http.get("/api/auth/me", () => {
    return HttpResponse.json(guestSession);
  }),

  http.delete("/api/auth/logout", () => {
    return HttpResponse.json(logoutSuccess);
  }),

  http.delete("/api/auth/withdraw", () => {
    return HttpResponse.json(withdrawSuccess);
  }),
];
