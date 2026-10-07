import "server-only";

import type { NextResponse } from "next/server";

/**
 * OAuth 성공 응답에 토큰을 포함하지 않는 단기 분석 신호 쿠키를 추가한다.
 * @param response 쿠키를 기록할 NextResponse.
 * @param isNewUser 백엔드 로그인 응답의 신규 가입 여부.
 * @returns 없음. response.cookies에 기록하며 추가 백엔드 호출은 하지 않는다.
 */
export function setAuthEventCookie(
  response: NextResponse,
  isNewUser: boolean,
): void {
  response.cookies.set(
    "dayro_auth_event",
    JSON.stringify({
      type: isNewUser ? "sign_up" : "login",
      eventId: crypto.randomUUID(),
    }),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    },
  );
}
