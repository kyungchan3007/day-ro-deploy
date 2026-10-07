/**
 * 보안 응답 헤더 구성 (shared/config).
 * `next.config.ts`의 `headers()`가 사용하고, 단위 테스트가 같은 값을 검증한다(issue #139·#141).
 * Next 설정 파일에서 import 하므로 외부 의존성·경로 별칭 없이 순수 함수로 유지한다.
 */

/** 기본 CSP 위반 수집처(BFF). trailingSlash 설정 때문에 끝 슬래시를 붙여 리다이렉트 없이 받는다. */
export const DEFAULT_CSP_REPORT_PATH = "/api/csp-report/";

/** Reporting API(`report-to`)에서 쓰는 엔드포인트 이름. */
export const CSP_REPORT_ENDPOINT_NAME = "csp-endpoint";

/**
 * 즉시 강제해도 기존 동작을 깨지 않는 CSP 지시어(issue #139 S5).
 * - frame-ancestors: 다른 사이트가 이 앱을 iframe 으로 덮는 클릭재킹 차단
 * - base-uri·object-src: <base> 주입·플러그인 실행 차단
 */
const ENFORCED_DIRECTIVES = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"];

/**
 * 전체 출처 허용 목록 CSP. 운영에서 위반 리포트를 확인한 뒤 강제로 전환한다(Report-Only).
 * - GA4: googletagmanager·google-analytics, Meta Pixel: connect.facebook.net·facebook.com
 * - Kakao 지도 SDK: dapi.kakao.com 스크립트, 지도 리소스는 *.daumcdn.net
 * - 로그인: 폼 제출 → /api/auth/kakao/start → kauth.kakao.com(→ 미로그인 시 accounts.kakao.com) 리다이렉트
 * - Next.js App Router 인라인 스크립트 때문에 script-src 'unsafe-inline'(nonce 도입 전까지)
 */
const REPORT_ONLY_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://connect.facebook.net https://dapi.kakao.com https://*.daumcdn.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://www.facebook.com https://connect.facebook.net https://dapi.kakao.com https://*.daumcdn.net",
  "frame-src 'self'",
  "form-action 'self' https://kauth.kakao.com https://accounts.kakao.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
];

export interface SecurityHeader {
  key: string;
  value: string;
}

export interface SecurityHeaderOptions {
  /**
   * CSP 위반 수집 주소. 없으면 BFF `/api/csp-report/`.
   * Sentry security endpoint 같은 외부 수집처를 쓰려면 `CSP_REPORT_URI`로 넣는다(빌드 시점 값).
   */
  reportUri?: string;
}

/**
 * 수집 주소로 쓸 수 있는 값인지 확인한다. 같은 출처 경로(`/…`) 또는 https 절대 URL 만 허용하고,
 * 헤더 값을 깨뜨릴 수 있는 `;`·`,`·공백·따옴표가 들어간 값은 버린다.
 */
function resolveReportUri(reportUri: string | undefined): string {
  const candidate = reportUri?.trim();
  if (!candidate || /[;,\s"]/.test(candidate)) {
    return DEFAULT_CSP_REPORT_PATH;
  }
  if (candidate.startsWith("/") && !candidate.startsWith("//")) {
    return candidate;
  }
  try {
    return new URL(candidate).protocol === "https:" ? candidate : DEFAULT_CSP_REPORT_PATH;
  } catch {
    return DEFAULT_CSP_REPORT_PATH;
  }
}

/**
 * 모든 응답에 붙이는 보안 헤더 목록. HSTS 는 도메인 단위로 Cloudflare 에서 설정한다.
 * 강제·Report-Only CSP 모두 위반을 `report-uri`(구형 브라우저)와 `report-to`(Reporting API)로 보낸다.
 */
export function buildSecurityHeaders({ reportUri }: SecurityHeaderOptions = {}): SecurityHeader[] {
  const uri = resolveReportUri(reportUri);
  const reporting = [`report-uri ${uri}`, `report-to ${CSP_REPORT_ENDPOINT_NAME}`];

  return [
    { key: "Content-Security-Policy", value: [...ENFORCED_DIRECTIVES, ...reporting].join("; ") },
    {
      key: "Content-Security-Policy-Report-Only",
      value: [...REPORT_ONLY_DIRECTIVES, ...reporting].join("; "),
    },
    { key: "Reporting-Endpoints", value: `${CSP_REPORT_ENDPOINT_NAME}="${uri}"` },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ];
}
