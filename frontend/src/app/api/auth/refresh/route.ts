import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthTokenCookies,
  readRefreshTokenCookie,
  refreshBackendAuth,
  setAuthTokenCookies,
} from "../../../../shared/api/server-auth";
import {
  bffErrorResponse,
  isBackendAuthRejection,
} from "../../../../shared/api/backend-error";

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
 * 새 토큰은 httpOnly 쿠키로만 내려주고 응답 본문에는 싣지 않는다.
 * 본문에 실으면 같은 출처의 스크립트(XSS·서드파티)가 토큰을 읽을 수 있어 httpOnly 가 무력화된다(issue #139 S1).
 * @param request 현재 요청. refresh token 쿠키를 읽는다.
 */
export async function POST(request: NextRequest) {
  const refreshToken = readRefreshTokenCookie(request);

  if (!refreshToken) {
    return unauthorizedResponse("리프레시 토큰이 없습니다.", request);
  }

  try {
    const auth = await refreshBackendAuth(refreshToken);
    const response = NextResponse.json({
      success: true,
      message: auth.message,
      data: null,
    });

    setAuthTokenCookies(request, response, {
      accessToken: auth.data.accessToken,
      refreshToken: auth.data.refreshToken,
    });

    return response;
  } catch (error) {
    // 토큰이 무효·만료일 때만 세션을 정리한다. 백엔드 장애(5xx·네트워크)에서는 쿠키를 유지해
    // 일시 장애로 모든 사용자가 로그아웃되는 것을 막는다(issue #139 S8).
    if (isBackendAuthRejection(error)) {
      return unauthorizedResponse("유효하지 않은 토큰입니다.", request);
    }
    return bffErrorResponse(error, "세션을 갱신하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
}
