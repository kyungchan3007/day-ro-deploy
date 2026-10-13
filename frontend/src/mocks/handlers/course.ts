import { http, HttpResponse } from "msw";

import type { CourseDeleteResponse } from "@/shared/api/openapi/dayro.openapi";

const deleteCourseSuccess: CourseDeleteResponse = {
  success: true,
  message: "코스가 삭제되었습니다.",
  data: null,
};

/** saved feature 브라우저 개발/스토리 환경용 BFF 삭제 계약. */
export const courseHandlers = [
  http.delete("/api/courses/:id", () => {
    return HttpResponse.json(deleteCourseSuccess);
  }),
];
