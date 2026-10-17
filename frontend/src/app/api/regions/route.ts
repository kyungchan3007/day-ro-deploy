import { NextResponse } from "next/server";
import { bffErrorResponse } from "../../../shared/api/backend-error";
import { getSituationRegions } from "../../../shared/api/server-situation";

/**
 * 지역 선택지 BFF endpoint.
 * 프런트 서버 계약 계층에서 지역 목록을 받아 BFF 응답으로 그대로 내려주고,
 * 실패 시 `bffErrorResponse` 규칙(백엔드 4xx·503 전달, 그 밖은 502)으로 정리한다.
 */
export async function GET() {
  try {
    const regions = await getSituationRegions();
    return NextResponse.json(regions);
  } catch (error) {
    return bffErrorResponse(error, "지역 목록을 불러오지 못했습니다.", []);
  }
}
