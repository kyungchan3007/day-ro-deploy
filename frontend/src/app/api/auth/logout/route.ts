import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthTokenCookies,
  logoutWithBackendAccessToken,
  readAccessTokenCookie,
} from "../../../../shared/api/server-auth";

/**
 * 현재 세션을 종료한다.
 * access token 이 있으면 백엔드 로그아웃을 먼저 시도하고,
 * 성공 여부와 무관하게 브라우저 쿠키는 항상 제거한다.
 * @param request 현재 요청. access token 쿠키를 읽고 제거 옵션도 계산한다.
 */
export async function DELETE(request: NextRequest) {
  const accessToken = readAccessTokenCookie(request);

  if (accessToken) {
    try {
      await logoutWithBackendAccessToken(accessToken);
    } catch {
      // 쿠키 제거는 항상 진행해 로컬 세션을 정리한다.
    }
  }

  const response = NextResponse.json({
    success: true,
    message: "로그아웃 되었습니다.",
    data: null,
  });

  clearAuthTokenCookies(request, response);
  return response;
}
