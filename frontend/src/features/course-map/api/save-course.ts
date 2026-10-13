import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import {
  courseSaveResponseSchema,
  type CourseSaveRequest,
  type CourseSaveResponse,
} from "../../../shared/api/openapi/dayro.openapi";

export class CourseSaveRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "CourseSaveRequestError";
    this.status = status;
  }
}

/**
 * 코스 저장 BFF를 호출해 현재 선택 순서를 사용자 계정에 저장한다.
 */
export async function requestCourseSave(
  request: CourseSaveRequest,
): Promise<CourseSaveResponse> {
  const response = await fetch(BFF_ENDPOINTS.courses, {
    method: "POST",
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
        : "코스 저장에 실패했습니다.";
    throw new CourseSaveRequestError(response.status, message);
  }

  return courseSaveResponseSchema.parse(json);
}
