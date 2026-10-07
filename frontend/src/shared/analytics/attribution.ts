import { UTM_KEYS } from "./query-keys";

export { UTM_KEYS };

export const ATTRIBUTION_KEY = "dayro_first_touch";

export const ATTRIBUTION_TTL = 90 * 24 * 60 * 60 * 1000;

type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;
function validate(input: Record<string, unknown>): Utm {
  const result: Utm = {};
  for (const key of UTM_KEYS) {
    const value = input[key];
    if (typeof value === "string" && /^[a-z0-9_\-.]{1,100}$/.test(value.toLowerCase())) {
      result[key] = value.toLowerCase();
    }
  }
  return result;
}

/**
 * 고정 90일 TTL과 값 검증을 통과한 최초 유입 정보를 읽는다.
 * @param now 만료 판단 기준 시각(ms).
 * @returns 유효한 UTM. 저장소 오류·손상·만료 시 빈 객체.
 */
export function readAttribution(now = Date.now()): Utm {
  try {
    const record = JSON.parse(localStorage.getItem(ATTRIBUTION_KEY) || "null");
    if (
      !record ||
      !Number.isFinite(record.createdAt) ||
      record.createdAt > now ||
      now - record.createdAt >= ATTRIBUTION_TTL ||
      !record.utm ||
      typeof record.utm !== "object"
    ) {
      return {};
    }
    return validate(record.utm);
  } catch {
    return {};
  }
}

/**
 * 유효한 최초 UTM 방문을 저장하며 기존 귀속의 만료 시각은 연장하지 않는다.
 * @param url 현재 방문의 절대 URL.
 * @param now 최초 저장 시각(ms).
 * @returns 없음. 저장소 오류는 전파하지 않는다.
 */
export function captureAttribution(url: string, now = Date.now()): void {
  try {
    if (Object.keys(readAttribution(now)).length) {
      return;
    }
    const utm = validate(Object.fromEntries(new URL(url).searchParams));
    if (Object.keys(utm).length) {
      localStorage.setItem(
        ATTRIBUTION_KEY,
        JSON.stringify({ createdAt: now, utm }),
      );
    }
  } catch {
    // Storage denial must not affect navigation.
  }
}

/**
 * 최초 유입을 GA 전환 이벤트 전용 속성으로 변환한다.
 * @returns first_utm_* 키를 가진 파라미터 객체.
 */
export function firstTouchParams() {
  return Object.fromEntries(
    Object.entries(readAttribution()).map(([key, value]) => [`first_${key}`, value]),
  );
}
