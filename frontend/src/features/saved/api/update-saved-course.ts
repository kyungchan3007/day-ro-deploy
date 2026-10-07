import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import {
  courseUpdateResponseSchema,
  type CourseUpdateRequest,
  type CourseUpdateResponse,
} from "../../../shared/api/openapi/dayro.openapi";

export class SavedCourseUpdateRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "SavedCourseUpdateRequestError";
    this.status = status;
  }
}

/**
 * 저장 코스 수정 BFF를 호출해 현재 순서를 사용자 계정에 반영한다.
 */
export async function requestSavedCourseUpdate(
  courseId: string,
  request: CourseUpdateRequest,
): Promise<CourseUpdateResponse> {
  const response = await fetch(`${BFF_ENDPOINTS.courses}/${courseId}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const json = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "message" in json &&
      typeof json.message === "string"
        ? json.message
        : "저장한 코스를 수정하지 못했습니다.";
    throw new SavedCourseUpdateRequestError(response.status, message);
  }

  return courseUpdateResponseSchema.parse(json);
}
