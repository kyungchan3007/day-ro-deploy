import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthTokenCookies,
  readAccessTokenCookie,
  withdrawWithBackendAccessToken,
} from "../../../../shared/api/server-auth";
import { bffErrorResponse } from "../../../../shared/api/backend-error";

/**
 * 현재 세션 사용자의 회원탈퇴를 처리한다.
 * 백엔드 탈퇴가 성공했을 때만 로컬 auth 쿠키를 제거한다.
 * @param request 현재 요청. access token 쿠키를 읽고 제거 옵션도 계산한다.
 */
export async function DELETE(request: NextRequest) {
  const accessToken = readAccessTokenCookie(request);

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        message: "로그인이 필요합니다.",
        data: null,
      },
      { status: 401 },
    );
  }

  try {
    const withdraw = await withdrawWithBackendAccessToken(accessToken);
    const response = NextResponse.json(withdraw);
    clearAuthTokenCookies(request, response);
    return response;
  } catch (error) {
    // 탈퇴 실패 시 쿠키는 유지하고, 상태·문구는 공통 규칙으로 정리한다(이전: 일괄 500, issue #139 S8).
    return bffErrorResponse(error, "회원 탈퇴에 실패했습니다.");
  }
}
