import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { situationInputRequestSchema } from "../../../shared/api/openapi/dayro.openapi";
import { submitSituation } from "../../../shared/api/server-situation";

/**
 * 상황 제출 BFF endpoint.
 * 브라우저 요청 body 를 `SituationInputRequest` 계약으로 검증한 뒤 공통 서버 계층으로 전달하고,
 * 입력 오류와 backend 오류를 프런트에서 다루기 쉬운 상태코드로 정리한다.
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = situationInputRequestSchema.parse(json);
    const result = await submitSituation(payload);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "잘못된 상황 입력 요청입니다.",
          data: null,
        },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "추천 코스를 불러오지 못했습니다.";

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
