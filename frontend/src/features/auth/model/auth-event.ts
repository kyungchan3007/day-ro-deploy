import { getAnalyticsConfig, type AnalyticsContext } from "@/shared/analytics";
import { enqueueEvent } from "@/shared/analytics/runtime";

export const AUTH_EVENT_COOKIE = "dayro_auth_event";

const memory = new Map<string, {
  ga: boolean;
  meta: boolean;
}>();

/**
 * 로그인 신호를 검증하고 중복 확인 → 벤더 제출 → 소비 기록 → 쿠키 삭제 순서로 소비한다.
 * @param context 예약 시 캡처한 이벤트 발생 문맥.
 * @returns 없음. 쿠키·저장소·벤더 오류는 인증 흐름에 전파하지 않는다.
 */
export function consumeAuthEvent(context: AnalyticsContext): void {
  try {
    const raw = document.cookie
      .split("; ")
      .find((value) => value.startsWith(`${AUTH_EVENT_COOKIE}=`))
      ?.slice(AUTH_EVENT_COOKIE.length + 1);
    if (!raw) {
      return;
    }
    const event = JSON.parse(decodeURIComponent(raw));
    const clear = () => {
      document.cookie = `${AUTH_EVENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
    };
    if (
      !event ||
      !["sign_up", "login"].includes(event.type) ||
      typeof event.eventId !== "string" ||
      !/^[a-zA-Z0-9-]{1,100}$/.test(event.eventId)
    ) {
      clear();
      return;
    }
    const key = `dayro_auth_consumed:${event.eventId}`;
    let previous = memory.get(key) || {
      ga: false,
      meta: false
    };
    try {
      const stored = JSON.parse(sessionStorage.getItem(key) || "null");
      if (stored) {
        previous = {
          ga: previous.ga || stored.ga === true,
          meta: previous.meta || stored.meta === true,
        };
      }
    } catch {
      // In-memory fallback for denied storage.
    }
    const result = enqueueEvent(event.type, {
      method: "kakao"
    }, context, previous);
    const consumed = {
      ga: previous.ga || result.ga,
      meta: previous.meta || result.meta
    };
    memory.set(key, consumed);
    try {
      sessionStorage.setItem(key, JSON.stringify(consumed));
    } catch {
      // In-memory fallback.
    }
    const config = getAnalyticsConfig();
    if ((!config.gaId || consumed.ga) && (!config.metaId || consumed.meta)) {
      clear();
    }
  } catch {
    // Corrupt cookies must not affect authentication.
  }
}
