/**
 * 인증 쿠키 이름·수명 (shared/api).
 * BFF 서버 계층(`server-auth-*`, `server-course`)과 auth feature 가 함께 쓰는 계약이라 shared 에 둔다.
 * auth feature 는 `features/auth/model/oauth.ts`에서 다시 내보낸다.
 */
export const OAUTH_STATE_COOKIE_NAME = "dayro_oauth_state";
/** 로그인 후 돌아갈 내부 경로. OAuth 왕복 동안 서버 httpOnly 쿠키로만 보관한다(issue #131). */
export const OAUTH_NEXT_COOKIE_NAME = "dayro_oauth_next";
export const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "dayro_refresh_token";

export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 30;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
