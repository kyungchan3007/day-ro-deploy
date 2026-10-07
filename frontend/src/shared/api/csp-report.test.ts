import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { MAX_CSP_REPORT_BYTES, parseCspReports, stripUrlDetails } from "./csp-report";
import { POST } from "../../app/api/csp-report/route";

describe("CSP report parsing (issue #141)", () => {
  it("parses the report-uri format and strips query/fragment", () => {
    const [report] = parseCspReports(
      JSON.stringify({
        "csp-report": {
          "document-uri": "https://dayro.example/course/new/?step=course&rev=abc#x",
          "blocked-uri": "https://cdn.example/lib.js?token=secret",
          "violated-directive": "script-src-elem",
          disposition: "report",
          "source-file": "https://dayro.example/_next/a.js?v=1",
          "line-number": 12,
        },
      }),
    );

    expect(report).toEqual({
      documentUrl: "https://dayro.example/course/new/",
      blockedUrl: "https://cdn.example/lib.js",
      directive: "script-src-elem",
      disposition: "report",
      sourceFile: "https://dayro.example/_next/a.js",
      lineNumber: 12,
    });
  });

  it("parses Reporting API batches and ignores other report types", () => {
    const reports = parseCspReports(
      JSON.stringify([
        { type: "csp-violation", body: { documentURL: "https://dayro.example/", blockedURL: "inline", effectiveDirective: "script-src", disposition: "report" } },
        { type: "deprecation", body: { id: "x" } },
      ]),
    );

    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ blockedUrl: "inline", directive: "script-src" });
  });

  it("returns nothing for junk bodies", () => {
    expect(parseCspReports("not json")).toEqual([]);
    expect(parseCspReports(JSON.stringify({ hello: "world" }))).toEqual([]);
    expect(parseCspReports(JSON.stringify([1, "a", null]))).toEqual([]);
  });

  it("keeps keyword values and strips URL details", () => {
    expect(stripUrlDetails("eval")).toBe("eval");
    expect(stripUrlDetails("data")).toBe("data");
    expect(stripUrlDetails("https://a.example/p?q=1#h")).toBe("https://a.example/p");
  });
});

describe("POST /api/csp-report (issue #141)", () => {
  afterEach(() => vi.restoreAllMocks());

  function report(body: string, headers: Record<string, string> = {}) {
    return POST(
      new NextRequest("http://localhost:3000/api/csp-report/", {
        method: "POST",
        headers: { "content-type": "application/csp-report", ...headers },
        body,
      }),
    );
  }

  it("logs a sanitized violation and answers 204", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await report(
      JSON.stringify({ "csp-report": { "document-uri": "https://dayro.example/?token=secret", "violated-directive": "img-src" } }),
    );

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][1])).toContain("img-src");
    expect(String(warn.mock.calls[0][1])).not.toContain("secret");
  });

  it("drops oversized bodies without logging", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const response = await report("x".repeat(MAX_CSP_REPORT_BYTES + 1));

    expect(response.status).toBe(204);
    expect(warn).not.toHaveBeenCalled();
  });
});
