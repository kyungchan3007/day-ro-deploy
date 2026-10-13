import { getAnalyticsConfig } from "./config";
import { isMetaBlockedUrl } from "./url";
import type { EnqueueResult } from "./runtime";

const injected = new Set<string>();

function injectScript(id: string, src: string): void {
  try {
    if (injected.has(id) || document.getElementById(id)) return;
    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    // SDK 실패는 분석 누락으로만 처리한다. 공식 stub 큐는 재설정하지 않는다.
    script.onerror = () => {};
    document.head.appendChild(script);
    injected.add(id);
  } catch {
    // 한 벤더의 DOM 주입 실패가 다른 벤더의 주입을 막지 않는다.
  }
}

/**
 * 초기화 완료된 벤더 SDK를 async script로 한 번만 주입한다.
 * @param ready 공식 stub과 config/init enqueue가 완료된 벤더 목록.
 * @returns 없음. 비활성·초기화 실패 벤더는 로드하지 않는다.
 */
export function loadVendorScripts(ready: EnqueueResult): void {
  const { gaId, metaId } = getAnalyticsConfig();
  if (gaId && ready.ga) {
    injectScript("dayro-ga", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
  }
  if (metaId && ready.meta && !isMetaBlockedUrl(window.location.href)) {
    injectScript("dayro-meta", "https://connect.facebook.net/en_US/fbevents.js");
  }
}
