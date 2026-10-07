import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";
import {
  CSP_REPORT_ENDPOINT_NAME,
  DEFAULT_CSP_REPORT_PATH,
  buildSecurityHeaders,
} from "./security-headers";

function headerMap(headers: { key: string; value: string }[]) {
  return Object.fromEntries(headers.map(({ key, value }) => [key, value]));
}

describe("security headers (issue #139 S5 · #141)", () => {
  const headers = headerMap(buildSecurityHeaders());

  it("enforces clickjacking/base/object protections", () => {
    const csp = headers["Content-Security-Policy"];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("keeps the full allowlist in Report-Only (GA·Meta·Kakao map·Kakao login)", () => {
    const reportOnly = headers["Content-Security-Policy-Report-Only"];
    expect(reportOnly).toContain("default-src 'self'");
    expect(reportOnly).toContain("https://*.googletagmanager.com");
    expect(reportOnly).toContain("https://connect.facebook.net");
    expect(reportOnly).toContain("https://dapi.kakao.com");
    expect(reportOnly).toContain("form-action 'self' https://kauth.kakao.com https://accounts.kakao.com");
  });

  it("sends nosniff, referrer and permissions policies", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("geolocation=()");
  });

  it("reports violations to the BFF by default via report-uri and report-to", () => {
    for (const key of ["Content-Security-Policy", "Content-Security-Policy-Report-Only"]) {
      expect(headers[key]).toContain(`report-uri ${DEFAULT_CSP_REPORT_PATH}`);
      expect(headers[key]).toContain(`report-to ${CSP_REPORT_ENDPOINT_NAME}`);
    }
    expect(headers["Reporting-Endpoints"]).toBe(`${CSP_REPORT_ENDPOINT_NAME}="${DEFAULT_CSP_REPORT_PATH}"`);
  });

  it("uses an https CSP_REPORT_URI when configured and ignores unsafe values", () => {
    const sentry = "https://o1.ingest.sentry.io/api/2/security/?sentry_key=abc";
    expect(headerMap(buildSecurityHeaders({ reportUri: sentry }))["Reporting-Endpoints"]).toBe(
      `${CSP_REPORT_ENDPOINT_NAME}="${sentry}"`,
    );

    for (const unsafe of ["http://collector.example/csp", "//evil.example", "/x; script-src *", "javascript:alert(1)"]) {
      expect(headerMap(buildSecurityHeaders({ reportUri: unsafe }))["Reporting-Endpoints"]).toBe(
        `${CSP_REPORT_ENDPOINT_NAME}="${DEFAULT_CSP_REPORT_PATH}"`,
      );
    }
  });

  it("applies the headers to every route through next.config and hides x-powered-by", async () => {
    const routes = await nextConfig.headers?.();
    expect(routes).toEqual([{ source: "/:path*", headers: buildSecurityHeaders({ reportUri: process.env.CSP_REPORT_URI }) }]);
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
