import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { situationInputRequestSchema } from "../../../shared/api/openapi/dayro.openapi";
import { submitBackendSituation } from "../../../shared/api/server-situation-client";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const payload = situationInputRequestSchema.parse(json);
    const result = await submitBackendSituation(payload);
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
