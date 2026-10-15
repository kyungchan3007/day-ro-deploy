import { NextRequest } from "next/server";

import { submitInquiryFromRequest } from "../../../shared/api/server-inquiry";

/**
 * FAQ 문의하기 BFF endpoint (issue #224, BE PR#218).
 * 입력 검증 · 백엔드 전달 · 오류 정규화는 shared 서버 계층에 위임한다.
 */
export async function POST(request: NextRequest) {
  return submitInquiryFromRequest(request);
}
