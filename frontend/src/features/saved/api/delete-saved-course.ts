import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import {
  courseDeleteResponseSchema,
  type CourseDeleteResponse,
} from "../../../shared/api/openapi/dayro.openapi";

export class SavedCourseDeleteRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SavedCourseDeleteRequestError";
    this.status = status;
  }
}

/** 브라우저에서 saved 소유 BFF만 호출해 저장 코스를 삭제한다. */
export async function requestSavedCourseDelete(
  courseId: string,
): Promise<CourseDeleteResponse> {
  const response = await fetch(`${BFF_ENDPOINTS.courses}/${courseId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  const json = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof json.message === "string"
        ? json.message
        : "저장한 코스를 삭제하지 못했습니다.";
    throw new SavedCourseDeleteRequestError(response.status, message);
  }

  return courseDeleteResponseSchema.parse(json);
}
