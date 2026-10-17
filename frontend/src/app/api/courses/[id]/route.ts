import { NextRequest } from "next/server";

import {
  deleteCourseFromRequest,
  getCourseDetailFromRequest,
  updateCourseFromRequest,
} from "../../../../shared/api/server-course";

/**
 * 저장 코스 상세 BFF endpoint.
 * `/saved/[id]` 화면이 사용할 상세 계약을 shared 서버 계층에 위임한다.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return getCourseDetailFromRequest(request, id);
}

/**
 * 저장 코스 수정 BFF endpoint.
 * `/saved/[id]` 화면이 바꾼 장소 순서를 shared 서버 계층의 수정 계약으로 위임한다.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return updateCourseFromRequest(request, id);
}

/** 저장 코스 삭제 BFF endpoint. */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return deleteCourseFromRequest(request, id);
}
