import { NextRequest, NextResponse } from "next/server";
import { resolveAuthSessionFromRequest } from "../../../../shared/api/server-auth-session";

/**
 * 현재 세션 사용자 조회 BFF.
 *
 * 홈 우측 메뉴처럼 비보호 라우트에서도 로그인 상태를 알아야 하므로,
 * 이 엔드포인트가 access token 검증과 필요 시 refresh 재발급까지 담당한다.
 */
export async function GET(request: NextRequest) {
  const response = new NextResponse();
  const session = await resolveAuthSessionFromRequest(request, response);
  const jsonResponse = NextResponse.json(session);

  for (const cookie of response.cookies.getAll()) {
    jsonResponse.cookies.set(cookie);
  }

  return jsonResponse;
}
