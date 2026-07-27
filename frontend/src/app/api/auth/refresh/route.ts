import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthTokenCookies,
  readRefreshTokenCookie,
  refreshBackendAuth,
  setAuthTokenCookies,
} from "../../../../shared/api/server-auth";

/**
 * refresh 실패 시 클라이언트 세션을 정리한 401 응답을 만든다.
 * @param message 응답 본문에 넣을 에러 메시지.
 * @param request 현재 요청. 쿠키 제거 옵션 계산에 사용한다.
 */
function unauthorizedResponse(message: string, request: NextRequest) {
  const response = NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status: 401 },
  );

  clearAuthTokenCookies(request, response);
  return response;
}

/**
 * 브라우저 쿠키의 refresh token 으로 새 auth 토큰을 발급한다.
 * @param request 현재 요청. refresh token 쿠키를 읽는다.
 */
export async function POST(request: NextRequest) {
  const refreshToken = readRefreshTokenCookie(request);

  if (!refreshToken) {
    return unauthorizedResponse("리프레시 토큰이 없습니다.", request);
  }

  try {
    const auth = await refreshBackendAuth(refreshToken);
    const response = NextResponse.json(auth);

    setAuthTokenCookies(request, response, {
      accessToken: auth.data.accessToken,
      refreshToken: auth.data.refreshToken,
    });

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "유효하지 않은 토큰입니다.";
    return unauthorizedResponse(message, request);
  }
}
