/**
 * auth feature public API.
 * 슬라이스 외부(widgets/app)는 이 배럴을 통해서만 접근한다.
 */
export { KakaoLoginButton } from "./ui/KakaoLoginButton";
export type { KakaoLoginButtonProps } from "./ui/KakaoLoginButton";
export { AccountMenu } from "./ui/AccountMenu";
export { WithdrawReasonForm } from "./ui/WithdrawReasonForm";
export {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  createOAuthState,
  buildKakaoAuthorizeUrl,
  buildLoginErrorSearchParams,
  getLoginErrorMessage,
} from "./model/oauth";
export type { LoginErrorKey } from "./model/oauth";
export {
  authOpenApi,
  kakaoLoginRequestSchema,
  refreshRequestSchema,
  authResponseDataSchema,
  authResponseSchema,
  logoutResponseSchema,
} from "@/shared/api/openapi/dayro.openapi";
export type {
  KakaoLoginRequest,
  RefreshRequest,
  AuthResponseData,
  AuthResponse,
  LogoutResponse,
} from "@/shared/api/openapi/dayro.openapi";
