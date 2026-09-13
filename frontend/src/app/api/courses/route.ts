import { NextRequest } from "next/server";
import {
  listCoursesFromRequest,
  saveCourseFromRequest,
} from "../../../shared/api/server-course";

/**
 * 코스 저장 BFF endpoint.
 * Route Handler 는 transport/bff 세부 로직을 shared 서버 계층에 위임한다.
 */
export async function POST(request: NextRequest) {
  return saveCourseFromRequest(request);
}

/**
 * 저장 코스 목록 BFF endpoint.
 * `/saved` 화면이 사용할 목록 계약을 shared 서버 계층에 위임한다.
 */
export async function GET(request: NextRequest) {
  return listCoursesFromRequest(request);
}
