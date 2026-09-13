import type { NextResponse } from "next/server";

/**
 * 내부 BFF 단계에서 쌓은 쿠키를 최종 응답으로 복사한다.
 * refresh 재발급 같은 중간 부수효과를 브라우저까지 유지할 때 사용한다.
 */
export function copyResponseCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
}
