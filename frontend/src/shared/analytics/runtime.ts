/**
 * 분석 runtime — 지연 로드 전용 보조 진입점.
 * 앱 코드는 `@/shared/analytics`(trackEvent·scheduleAnalytics)만 정적으로 import하고,
 * 이 모듈은 활성 gate 통과 후 `import()`로만 불러온다(정적 import 시 root first-load에 실린다).
 * 예외: 그 자체가 지연 로드되는 모듈(`features/auth/model/auth-event.ts`)은 정적 import 허용.
 */
import { getAnalyticsConfig } from "./config";
import { captureAttribution, firstTouchParams } from "./attribution";
import { META_EVENTS, sanitizeParams, type AnalyticsEvents, type EventName } from "./events";
import { isMetaBlockedUrl, sanitizeUrl } from "./url";
import type { AnalyticsContext } from "./dispatch";
import { loadVendorScripts } from "./scripts";

type VendorFunction = (...args: unknown[]) => void;

type Pixel = VendorFunction & {
  callMethod?: VendorFunction;
  queue: unknown[];
  push: Pixel;
  loaded: boolean;
  version: string;
  /** true면 SDK가 history 변경마다 자동 PageView를 보내지 않는다(페이지뷰는 앱이 직접 소유). */
  disablePushState?: boolean;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: VendorFunction;
    fbq?: Pixel;
    _fbq?: Pixel;
  }
}
let gaInitialized: string | undefined;
let metaInitialized: string | undefined;

export type EnqueueResult = {
  ga: boolean;
  meta: boolean;
};

/**
 * 활성 벤더의 공식 stub과 config/init 명령을 이벤트보다 먼저 준비한다.
 * @param context 이벤트 발생 시점의 URL과 시간.
 * @returns 벤더별 초기화 성공 여부. 한 벤더의 오류는 다른 벤더에 전파하지 않는다.
 */
export function ensureInitialized(context: AnalyticsContext): EnqueueResult {
  const result = {
    ga: false,
    meta: false,
  };
  if (typeof window === "undefined") {
    return result;
  }
  const { gaId, metaId } = getAnalyticsConfig();
  try {
    if (gaId) {
      window.dataLayer = window.dataLayer || [];
      // 공식 gtag stub 계약: arguments 객체를 그대로 dataLayer 큐에 넣는다.
      window.gtag = window.gtag || function () {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments);
      };
      if (gaInitialized !== gaId) {
        window.gtag("js", new Date());
        // page_location·referrer·timestamp는 config에 고정하지 않는다.
        // config 값은 이후 자동 이벤트에도 남으므로 이벤트마다 enqueueEvent에서 붙인다.
        window.gtag("config", gaId, { send_page_view: false });
        gaInitialized = gaId;
      }
      result.ga = true;
    }
  } catch {
    // GA 초기화 실패가 Meta 초기화를 막지 않는다.
  }
  try {
    if (metaId && !isMetaBlockedUrl(context.url) && !isMetaBlockedUrl(window.location.href)) {
      if (!window.fbq) {
        const pixel = function () {
          // 공식 Pixel stub 계약: SDK 로드 전 호출은 queue에 쌓고, 로드 후에는 callMethod로 위임한다.
          if (pixel.callMethod) {
            // eslint-disable-next-line prefer-rest-params, prefer-spread
            pixel.callMethod.apply(pixel, Array.from(arguments));
          } else {
            // eslint-disable-next-line prefer-rest-params
            pixel.queue.push(arguments);
          }
        } as Pixel;
        pixel.queue = [];
        pixel.push = pixel;
        pixel.loaded = true;
        pixel.version = "2.0";
        window.fbq = pixel;
        window._fbq = window._fbq || pixel;
      }
      // SDK 로드 전에 설정해야 쿼리 전환(?step=)·로그인 이동에서 자동 PageView가 나가지 않는다.
      window.fbq.disablePushState = true;
      if (metaInitialized !== metaId) {
        window.fbq("set", "autoConfig", false, metaId);
        window.fbq("init", metaId);
        metaInitialized = metaId;
      }
      result.meta = true;
    }
  } catch {
    // 분석 초기화 실패가 앱 동작으로 전파되지 않게 한다.
  }
  return result;
}

/**
 * URL·파라미터를 정제한 이벤트를 벤더별로 독립 제출한다.
 * @param name 카탈로그 이벤트명.
 * @param params 이벤트별 허용 파라미터.
 * @param context 호출 시 동기 캡처한 발생 문맥.
 * @param skip 이미 제출해 재전송하지 않을 벤더.
 * @returns 벤더별 enqueue 성공 여부. 예외는 호출자에 전파하지 않는다.
 */
export function enqueueEvent<N extends EventName>(
  name: N,
  params: AnalyticsEvents[N],
  context: AnalyticsContext,
  skip: Partial<EnqueueResult> = {},
): EnqueueResult {
  const result = {
    ga: false,
    meta: false,
  };
  try {
    if (typeof window === "undefined") {
      return result;
    }
    const config = getAnalyticsConfig();
    if (!config.gaId && !config.metaId) {
      return result;
    }
    captureAttribution(context.url, context.timestamp);
    const safe = sanitizeParams(name, params);
    const ready = ensureInitialized(context);
    try {
      if (ready.ga && !skip.ga) {
        window.gtag!("event", name, {
          ...safe,
          ...(name === "page_view" ? {} : firstTouchParams()),
          event_timestamp_ms: context.timestamp,
          page_location: sanitizeUrl(context.url),
          page_referrer: sanitizeUrl(context.referrer),
        });
        result.ga = true;
      }
    } catch {
      // GA 제출 실패와 무관하게 Meta 제출을 시도한다.
    }
    try {
      if (
        ready.meta &&
        !skip.meta &&
        !isMetaBlockedUrl(context.url) &&
        !isMetaBlockedUrl(window.location.href)
      ) {
        window.fbq!(...META_EVENTS[name], safe);
        result.meta = true;
      }
    } catch {
      // 클라이언트 제출은 best effort다.
    }
    loadVendorScripts(ready);
  } catch {
    // 잘못된 입력이나 사용할 수 없는 브라우저 API는 no-op으로 처리한다.
  }
  return result;
}


let previousPathname: string | undefined;

/**
 * 순서대로 도착한 경로 방문을 기록하며 연속된 동일 pathname은 무시한다.
 * @param context root effect가 동기 캡처한 방문 URL과 시간.
 * @returns 없음. A→B→A 재방문은 각각 집계한다.
 */
export function trackPageView(context: AnalyticsContext): void {
  if (previousPathname === context.pathname) return;
  previousPathname = context.pathname;
  enqueueEvent("page_view", {}, context);
}
