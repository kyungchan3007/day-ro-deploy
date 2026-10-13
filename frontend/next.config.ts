import type { NextConfig } from "next";

import { HTML_LIMITED_BOTS } from "./src/shared/config/html-limited-bots";
import { buildSecurityHeaders } from "./src/shared/config/security-headers";

/** 보안 헤더(CSP·XFO·nosniff 등). 구성은 `src/shared/config/security-headers.ts`에서 관리·테스트한다. */
const securityHeaders = buildSecurityHeaders({ reportUri: process.env.CSP_REPORT_URI });

const nextConfig: NextConfig = {
  // E2E(및 로컬)에서 dev 서버를 127.0.0.1 로 접속할 때 Next dev 리소스가
  // cross-origin 으로 차단되어 클라이언트 하이드레이션/네비게이션이 깨지는 것을 방지한다.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // 응답에 서버 기술 스택을 노출하지 않는다.
  poweredByHeader: false,
  // 카카오톡 등 메신저 미리보기 수집기에도 og 메타를 <head> 로 보낸다(issue #187 공유 미리보기).
  htmlLimitedBots: HTML_LIMITED_BOTS,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
