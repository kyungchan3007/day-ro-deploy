import { NextRequest, NextResponse } from "next/server";
import { bffErrorResponse } from "../../../../../shared/api/backend-error";
import { readAccessTokenCookie } from "../../../../../shared/api/server-auth";
import { retrySituation } from "../../../../../shared/api/server-situation";

/**
 * 다른 코스 보기 retry BFF endpoint.
 * path 의 requestId 를 검증한 뒤 공통 서버 계층으로 전달하고,
 * backend 오류는 `bffErrorResponse` 규칙으로 정리한다(429 한도 소진·404 세션 만료 등 상태 전달, issue #139 S8).
 * 로그인 상태면 httpOnly 쿠키의 access token 을 백엔드에 함께 전달한다(비로그인 허용, issue #135).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  const { requestId } = await context.params;

  if (!requestId) {
    return NextResponse.json(
      {
        success: false,
        message: "잘못된 추천 재요청입니다.",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    const result = await retrySituation(requestId, {
      accessToken: readAccessTokenCookie(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    return bffErrorResponse(error, "다른 추천 코스를 불러오지 못했습니다.");
  }
}
