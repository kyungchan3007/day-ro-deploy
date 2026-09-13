import { NextRequest, NextResponse } from "next/server";
import { retrySituation } from "../../../../../shared/api/server-situation";

/**
 * 다른 코스 보기 retry BFF endpoint.
 * path 의 requestId 를 검증한 뒤 공통 서버 계층으로 전달하고,
 * backend 오류를 프런트에서 다루기 쉬운 응답으로 정리한다.
 */
export async function POST(
  _request: NextRequest,
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
    const result = await retrySituation(requestId);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "다른 추천 코스를 불러오지 못했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
        data: null,
      },
      { status: 502 },
    );
  }
}
