import { ATTRIBUTION_QUERY_KEYS } from "./query-keys";

const ALLOWED_QUERY_KEYS = ATTRIBUTION_QUERY_KEYS;

/**
 * URL에서 허용한 유입 쿼리만 남기고 인증 정보와 fragment를 제거한다.
 * @param input 정제할 절대 URL.
 * @returns 정제한 HTTP(S) URL. 파싱 실패 또는 다른 프로토콜은 빈 문자열.
 */
export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }
    const query = new URLSearchParams();
    for (const key of ALLOWED_QUERY_KEYS) {
      const value = url.searchParams.get(key);
      if (value !== null) {
        query.set(key, value);
      }
    }
    return `${url.origin}${url.pathname}${query.size ? `?${query}` : ""}`;
  } catch {
    return "";
  }
}

const COURSE_FLOW_PATH = "/course/new";
const COURSE_FLOW_STEPS = new Set(["time", "region", "purpose", "loading", "result", "course"]);
const COURSE_FLOW_REV_PATTERN = /^[a-z0-9]{8}$/;

/**
 * 코스 만들기 주소에서만 허용하는 키인지 판정한다(issue #129, ADR-26).
 * 조건·장소는 주소에 없고, rev 는 탭 로컬 스냅샷을 가리키는 일회성 참조라 전송을 허용한다.
 */
function isAllowedCourseFlowParam(pathname: string, key: string, value: string): boolean {
  if (pathname !== COURSE_FLOW_PATH) {
    return false;
  }
  if (key === "step") {
    return COURSE_FLOW_STEPS.has(value);
  }
  if (key === "rev") {
    return COURSE_FLOW_REV_PATTERN.test(value);
  }
  return false;
}

/**
 * Meta Pixel 발행을 막아야 하는 URL인지 판정한다.
 * Meta는 요청마다 현재 주소 전체를 자동 수집하고 코드로 정제할 수 없으므로 아래 주소에서는 발행하지 않는다.
 * - 로그인 화면
 * - fragment 가 있거나 같은 키가 중복된 주소
 * - 허용 목록(유입 키, `/course/new`의 step·rev) 밖 쿼리가 붙은 주소
 * @param input 판정할 절대 URL. 파싱할 수 없으면 차단한다.
 * @returns 차단해야 하면 true.
 */
export function isMetaBlockedUrl(input: string): boolean {
  try {
    const url = new URL(input);
    const pathname = url.pathname.replace(/\/+$/, "");
    if (pathname === "/login" || url.hash) {
      return true;
    }
    const keys = [...url.searchParams.keys()];
    if (new Set(keys).size !== keys.length) {
      return true;
    }
    for (const [key, value] of url.searchParams) {
      if (!ALLOWED_QUERY_KEYS.includes(key) && !isAllowedCourseFlowParam(pathname, key, value)) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}
