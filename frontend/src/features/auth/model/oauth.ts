const LOGIN_ERROR_MESSAGES = {
  oauth_cancelled: "카카오 로그인이 취소되었어요. 다시 시도해주세요.",
  oauth_state_missing: "로그인 요청 정보가 없어 다시 시도해주세요.",
  oauth_state_mismatch: "로그인 검증에 실패했어요. 다시 시도해주세요.",
  oauth_code_missing: "카카오 인가 코드가 없어 로그인을 완료할 수 없어요.",
  oauth_token_exchange_failed:
    "카카오 인증 확인에 실패했어요. 잠시 후 다시 시도해주세요.",
  oauth_backend_failed:
    "데이로 로그인 처리에 실패했어요. 잠시 후 다시 시도해주세요.",
  oauth_config_missing:
    "로그인 설정이 완료되지 않았어요. 관리자에게 문의해주세요.",
} as const;

export type LoginErrorKey = keyof typeof LOGIN_ERROR_MESSAGES;

export const OAUTH_STATE_COOKIE_NAME = "dayro_oauth_state";
export const ACCESS_TOKEN_COOKIE_NAME = "dayro_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "dayro_refresh_token";

export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;
export const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 30;
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export function createOAuthState() {
  return crypto.randomUUID().replace(/-/g, "");
}

export function buildKakaoAuthorizeUrl({
  clientId,
  redirectUri,
  state,
}: {
  clientId: string;
  redirectUri: string;
  state: string;
}) {
  const searchParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `https://kauth.kakao.com/oauth/authorize?${searchParams.toString()}`;
}

export function getLoginErrorMessage(error?: string | null) {
  if (!error) {
    return null;
  }

  if (error in LOGIN_ERROR_MESSAGES) {
    return LOGIN_ERROR_MESSAGES[error as LoginErrorKey];
  }

  return "로그인을 완료하지 못했어요. 다시 시도해주세요.";
}

export function buildLoginErrorSearchParams(params: {
  error?: string;
  message?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  if (params.message) {
    searchParams.set("message", params.message);
  }

  return searchParams.toString();
}
