import "server-only";

/** 한 요청에서 받는 최대 본문 크기. 정상 리포트는 1~2KB 수준이라 넉넉히 잡고 그 이상은 버린다. */
export const MAX_CSP_REPORT_BYTES = 16 * 1024;

/** 한 요청에서 로그로 남길 최대 리포트 수(Reporting API 는 여러 건을 묶어 보낸다). */
export const MAX_CSP_REPORTS_PER_REQUEST = 20;

/** 서버 로그에 남기는 CSP 위반 요약. URL 은 쿼리·fragment 를 지운 origin+path 만 남긴다. */
export interface CspViolationSummary {
  documentUrl: string | null;
  blockedUrl: string | null;
  directive: string | null;
  disposition: string | null;
  sourceFile: string | null;
  lineNumber: number | null;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(record: UnknownRecord, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      return value.slice(0, 512);
    }
  }
  return null;
}

function pickNumber(record: UnknownRecord, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

/**
 * 리포트 속 URL 에서 쿼리·fragment 를 지운다(토큰·개인정보가 섞일 수 있음).
 * `inline`·`eval`·`data` 같은 키워드 값은 그대로 둔다.
 */
export function stripUrlDetails(value: string | null): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/)[0] ?? null;
  }
}

function summarize(body: UnknownRecord): CspViolationSummary {
  return {
    documentUrl: stripUrlDetails(pickString(body, "documentURL", "document-uri")),
    blockedUrl: stripUrlDetails(pickString(body, "blockedURL", "blocked-uri")),
    directive: pickString(body, "effectiveDirective", "effective-directive", "violated-directive"),
    disposition: pickString(body, "disposition"),
    sourceFile: stripUrlDetails(pickString(body, "sourceFile", "source-file")),
    lineNumber: pickNumber(body, "lineNumber", "line-number"),
  };
}

/**
 * 브라우저가 보낸 CSP 위반 리포트를 요약 목록으로 바꾼다.
 * - `report-uri` 형식: `{ "csp-report": { ... } }` (application/csp-report)
 * - Reporting API 형식: `[{ type: "csp-violation", body: { ... } }]` (application/reports+json)
 * 형식이 다르거나 JSON 이 아니면 빈 목록을 돌려준다.
 * @param text 요청 본문 문자열.
 */
export function parseCspReports(text: string): CspViolationSummary[] {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return [];
  }

  if (isRecord(json) && isRecord(json["csp-report"])) {
    return [summarize(json["csp-report"])];
  }

  if (Array.isArray(json)) {
    return json
      .filter(
        (entry): entry is UnknownRecord =>
          isRecord(entry) && entry.type === "csp-violation" && isRecord(entry.body),
      )
      .slice(0, MAX_CSP_REPORTS_PER_REQUEST)
      .map((entry) => summarize(entry.body as UnknownRecord));
  }

  return [];
}
