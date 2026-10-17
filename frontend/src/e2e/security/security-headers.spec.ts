import { expect, test } from "@playwright/test";

/**
 * 실제 응답에 보안 헤더가 붙는지 확인한다(issue #139 S5 · #141).
 * next.config 의 headers() 설정이 바뀌어 헤더가 빠지면 CI 에서 실패한다.
 */
test("pages and BFF responses carry the security headers", async ({ request }) => {
  for (const path of ["/", "/login/", "/api/regions/"]) {
    const response = await request.get(path);
    const headers = response.headers();

    expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"], path).toContain("report-to csp-endpoint");
    expect(headers["content-security-policy-report-only"], path).toContain("default-src 'self'");
    expect(headers["reporting-endpoints"], path).toContain("csp-endpoint=");
    expect(headers["x-frame-options"], path).toBe("DENY");
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"], path).toContain("camera=()");
    expect(headers["x-powered-by"], path).toBeUndefined();
  }
});

test("the CSP report endpoint accepts browser reports", async ({ request }) => {
  const response = await request.post("/api/csp-report/", {
    headers: { "content-type": "application/csp-report" },
    data: JSON.stringify({ "csp-report": { "document-uri": "http://127.0.0.1/", "violated-directive": "img-src" } }),
  });

  expect(response.status()).toBe(204);
});
