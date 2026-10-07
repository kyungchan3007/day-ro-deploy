import { getAnalyticsConfig } from "./config";

export interface AnalyticsContext {
  url: string;
  referrer: string;
  pathname: string;
  timestamp: number;
}

let pending: Promise<void> = Promise.resolve();

/**
 * 활성 gate를 통과한 작업의 발생 문맥을 즉시 캡처하고 호출 순서대로 실행한다.
 * @param task 내부에서 runtime을 지연 import하는 작업. 비활성 시 호출하지 않는다.
 * @returns 없음. import·실행 오류를 격리해 다음 작업이 계속 진행되게 한다.
 */
export function scheduleAnalytics(
  task: (context: AnalyticsContext) => Promise<unknown>,
): void {
  try {
    const config = getAnalyticsConfig();
    if (typeof window === "undefined" || (!config.gaId && !config.metaId)) return;

    const context: AnalyticsContext = {
      url: window.location.href,
      referrer: document.referrer,
      pathname: window.location.pathname,
      timestamp: Date.now(),
    };
    pending = pending.then(() => task(context)).then(() => {}, () => {});
  } catch {
    // 환경·브라우저 API 오류가 앱 동작으로 전파되지 않게 한다.
  }
}

/**
 * 현재까지 예약한 분석 작업이 끝날 때까지 기다린다.
 * @returns 이미 예약된 작업의 완료 promise. 벤더 네트워크 수신은 보장하지 않는다.
 */
export function flushAnalytics(): Promise<void> {
  return pending;
}
