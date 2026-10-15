import { NextRequest, NextResponse } from "next/server";
import { situationInputRequestSchema } from "../../../shared/api/openapi/dayro.openapi";
import { bffErrorResponse } from "../../../shared/api/backend-error";
import { readAccessTokenCookie } from "../../../shared/api/server-auth";
import { submitSituation } from "../../../shared/api/server-situation";

/**
 * 상황 제출 BFF endpoint.
 * 브라우저 요청 body 를 `SituationInputRequest` 계약으로 검증한 뒤 공통 서버 계층으로 전달한다.
 * 로그인 상태면 httpOnly 쿠키의 access token 을 백엔드에 함께 전달한다(비로그인 허용, issue #135).
 * 오류 상태·문구는 `bffErrorResponse` 규칙(백엔드 4xx·503 전달, 그 밖은 502)을 따른다(issue #139 S8).
 */
export async function POST(request: NextRequest) {
  // 입력 검증과 백엔드 호출을 분리한다. 백엔드 응답 계약 불일치(ZodError)를 입력 오류(400)로 오인하지 않기 위함이다.
  const payload = situationInputRequestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json(
      {
        success: false,
        message: "잘못된 상황 입력 요청입니다.",
        data: null,
      },
      { status: 400 },
    );
  }

  try {
    const result = await submitSituation(payload.data, {
      accessToken: readAccessTokenCookie(request),
    });
    return NextResponse.json(result);
  } catch (error) {
    return bffErrorResponse(error, "추천 코스를 불러오지 못했습니다.");
  }
}
