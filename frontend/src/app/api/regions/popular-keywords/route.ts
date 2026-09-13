import { NextResponse } from "next/server";
import { getSituationPopularKeywords } from "../../../../shared/api/server-situation";

/**
 * 지역 인기 검색어 BFF endpoint.
 * 프런트 서버 계약 계층에서 인기 검색어 목록을 받아 BFF 응답으로 그대로 내려주고,
 * 실패 시 사용자 노출 가능한 메시지와 함께 502 로 정규화한다.
 */
export async function GET() {
  try {
    const keywords = await getSituationPopularKeywords();
    return NextResponse.json(keywords);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "인기 검색어를 불러오지 못했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
        data: [],
      },
      { status: 502 },
    );
  }
}
