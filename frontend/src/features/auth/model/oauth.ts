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

const LOGIN_NOTICE_MESSAGES = {
  logged_out: "로그아웃 되었어요.",
} as const;

export type LoginErrorKey = keyof typeof LOGIN_ERROR_MESSAGES;
export type LoginNoticeKey = keyof typeof LOGIN_NOTICE_MESSAGES;

// 쿠키 이름·수명은 BFF 서버 계층과 공유하므로 shared/api 에 두고 여기서 다시 내보낸다(shared → features 금지).
export {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_SECONDS,
  OAUTH_NEXT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "../../../shared/api/auth-cookies";

const LOGIN_NEXT_MAX_LENGTH = 2048;
const LOGIN_NEXT_BASE = "http://dayro.internal";
// 제어 문자(U+0000~U+001F, U+007F)와 역슬래시는 브라우저마다 경로 해석이 달라 거부한다.
const LOGIN_NEXT_FORBIDDEN = /[\u0000-\u001f\u007f\\]/;

/**
 * 로그인 후 돌아갈 경로를 검증한다(오픈 리다이렉트 방지, issue #131).
 * 같은 사이트의 내부 경로만 허용하고 `/api/*`·`/login` 은 제외한다.
 * page·start 라우트·callback 이 모두 이 함수로 다시 검증한다.
 * @param raw 쿼리·폼·쿠키에서 읽은 값.
 * @returns 안전한 `pathname + search`(fragment 제거). 허용하지 않으면 null.
 */
export function sanitizeLoginNextPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > LOGIN_NEXT_MAX_LENGTH) {
    return null;
  }
  if (!raw.startsWith("/") || raw.startsWith("//") || LOGIN_NEXT_FORBIDDEN.test(raw)) {
    return null;
  }
  // 인코딩된 슬래시·역슬래시는 이후 리다이렉트 단계에서 디코딩되면 `//host` 가 될 수 있어 미리 거부한다.
  if (/%2f|%5c/i.test(raw)) {
    return null;
  }

  try {
    const url = new URL(raw, LOGIN_NEXT_BASE);
    // `.`·`..` 조각 정리 결과가 `//host` 가 되면(예: `/..//evil.com`) 다시 해석할 때 외부 도메인이 된다.
    // 정리된 pathname 도 `//` 로 시작하면 거부한다.
    if (url.origin !== LOGIN_NEXT_BASE || url.pathname.startsWith("//")) {
      return null;
    }
    const pathname = (url.pathname.replace(/\/+$/, "") || "/").toLowerCase();
    if (
      pathname === "/login" ||
      pathname.startsWith("/login;") ||
      pathname === "/api" ||
      pathname.startsWith("/api/")
    ) {
      return null;
    }
    const result = `${url.pathname}${url.search}`;
    // 반환값을 다시 해석해도 같은 origin 인지 한 번 더 확인한다(해석 차이가 있는 입력 방어).
    if (new URL(result, LOGIN_NEXT_BASE).origin !== LOGIN_NEXT_BASE) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

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

  // `in` 은 `__proto__` 같은 프로토타입 키도 통과시켜 객체가 렌더될 수 있어 자기 속성만 본다.
  if (Object.hasOwn(LOGIN_ERROR_MESSAGES, error)) {
    return LOGIN_ERROR_MESSAGES[error as LoginErrorKey];
  }

  return "로그인을 완료하지 못했어요. 다시 시도해주세요.";
}

export function getLoginNoticeMessage(notice?: string | null) {
  if (!notice) {
    return null;
  }

  if (Object.hasOwn(LOGIN_NOTICE_MESSAGES, notice)) {
    return LOGIN_NOTICE_MESSAGES[notice as LoginNoticeKey];
  }

  return null;
}

/**
 * 로그인 실패 시 로그인 화면으로 보낼 쿼리를 만든다.
 * 화면 문구는 error 코드 → 고정 문구 매핑(`getLoginErrorMessage`)으로만 보여주고,
 * 자유 문구(백엔드 예외 메시지 등)는 URL 에 싣지 않는다(issue #139 S4 — 문구 위조·내부 오류 노출 방지).
 */
export function buildLoginErrorSearchParams(params: {
  error?: string;
  /** 재시도해도 원래 화면으로 돌아가도록 유지할 경로. 검증을 통과한 값만 싣는다. */
  next?: string | null;
}) {
  const searchParams = new URLSearchParams();

  if (params.error) {
    searchParams.set("error", params.error);
  }

  const next = sanitizeLoginNextPath(params.next);
  if (next) {
    searchParams.set("next", next);
  }

  return searchParams.toString();
}

export function buildLoginNoticeSearchParams(params: { notice?: LoginNoticeKey }) {
  const searchParams = new URLSearchParams();

  if (params.notice) {
    searchParams.set("notice", params.notice);
  }

  return searchParams.toString();
}
