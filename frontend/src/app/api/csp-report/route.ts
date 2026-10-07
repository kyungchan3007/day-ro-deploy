import { NextRequest, NextResponse } from "next/server";
import {
  MAX_CSP_REPORT_BYTES,
  parseCspReports,
} from "../../../shared/api/csp-report";

/**
 * CSP 위반 리포트 수집 BFF endpoint(issue #141).
 * 브라우저가 `report-uri`·`report-to`로 보낸 위반을 요약해 서버 로그(`[CSP]`)에 남긴다.
 * Report-Only 허용 목록을 강제로 전환하기 전, 운영에서 빠진 출처를 확인하는 용도다.
 * - 본문 16KB 초과·형식 오류는 버린다. URL 은 쿼리·fragment 를 지우고 남긴다.
 * - 응답은 항상 204(브라우저는 응답을 쓰지 않고, 처리 결과를 외부에 알리지 않는다).
 */
export async function POST(request: NextRequest) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_CSP_REPORT_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await request.text().catch(() => "");
  if (text.length > MAX_CSP_REPORT_BYTES) {
    return new NextResponse(null, { status: 204 });
  }

  for (const violation of parseCspReports(text)) {
    console.warn("[CSP] 위반", JSON.stringify(violation));
  }

  return new NextResponse(null, { status: 204 });
}
