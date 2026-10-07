import { NextResponse } from "next/server";
import { bffErrorResponse } from "../../../../shared/api/backend-error";
import { getSituationPopularKeywords } from "../../../../shared/api/server-situation";

/**
 * 지역 인기 검색어 BFF endpoint.
 * 프런트 서버 계약 계층에서 인기 검색어 목록을 받아 BFF 응답으로 그대로 내려주고,
 * 실패 시 `bffErrorResponse` 규칙(백엔드 4xx·503 전달, 그 밖은 502)으로 정리한다.
 */
export async function GET() {
  try {
    const keywords = await getSituationPopularKeywords();
    return NextResponse.json(keywords);
  } catch (error) {
    return bffErrorResponse(error, "인기 검색어를 불러오지 못했습니다.", []);
  }
}
