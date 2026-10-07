import { scheduleAnalytics } from "./dispatch";
import type { AnalyticsEvents, EventName } from "./events";

/**
 * 이벤트 입력을 복사하고 활성 환경에서만 분석 runtime에 비동기로 위임한다.
 * @param name 카탈로그 이벤트명.
 * @param params 이벤트별 파라미터. 호출 후 원본 변경은 전송 내용에 영향이 없다.
 * @returns 없음. 문맥은 예약 시 캡처하며 import·전송 오류는 전파하지 않는다.
 */
export function trackEvent<N extends EventName>(
  name: N,
  params: AnalyticsEvents[N],
): void {
  try {
    const snapshot = { ...params };
    scheduleAnalytics(async (context) => {
      const runtime = await import("./runtime");
      runtime.enqueueEvent(name, snapshot, context);
    });
  } catch {
    // 잘못된 입력이나 getter 오류도 앱 성공 흐름을 방해하지 않는다.
  }
}
