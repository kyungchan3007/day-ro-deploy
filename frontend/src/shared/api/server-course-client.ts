import {
  courseDetailResponseSchema,
  courseDeleteResponseSchema,
  courseSummaryListResponseSchema,
  courseSaveResponseSchema,
  courseUpdateResponseSchema,
  type CourseDetailResponse,
  type CourseDeleteResponse,
  type CourseSummaryListResponse,
  type CourseSaveRequest,
  type CourseSaveResponse,
  type CourseUpdateRequest,
  type CourseUpdateResponse,
} from "./openapi/dayro.openapi";

export class BackendCourseRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "BackendCourseRequestError";
    this.status = status;
  }
}

function getBackendBaseUrl() {
  return process.env.BACKEND_API_BASE_URL ?? "http://localhost:8080";
}

function getBackendErrorMessage(json: unknown, fallbackMessage: string) {
  if (typeof json === "object" && json !== null && "message" in json) {
    const { message } = json;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

/**
 * 인증된 사용자의 저장 코스 생성 요청을 외부 백엔드에 전달한다.
 * access token 으로 Authorization 헤더를 만들고 백엔드 저장 응답 계약을 검증한다.
 */
export async function saveCourseWithBackendAccessToken(
  accessToken: string,
  request: CourseSaveRequest,
): Promise<CourseSaveResponse> {
  const response = await fetch(new URL("/api/courses", getBackendBaseUrl()), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BackendCourseRequestError(
      response.status,
      getBackendErrorMessage(json, "코스 저장에 실패했습니다."),
    );
  }

  return courseSaveResponseSchema.parse(json);
}

/**
 * 인증된 사용자의 저장 코스 목록 조회를 외부 백엔드에 전달한다.
 * access token 으로 Authorization 헤더를 만들고 백엔드 목록 응답 계약을 검증한다.
 */
export async function fetchCoursesWithBackendAccessToken(
  accessToken: string,
): Promise<CourseSummaryListResponse> {
  const response = await fetch(new URL("/api/courses", getBackendBaseUrl()), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BackendCourseRequestError(
      response.status,
      getBackendErrorMessage(json, "저장한 코스를 불러오지 못했습니다."),
    );
  }

  return courseSummaryListResponseSchema.parse(json);
}

/**
 * 인증된 사용자의 저장 코스 상세 조회를 외부 백엔드에 전달한다.
 * access token 으로 Authorization 헤더를 만들고 상세 응답 계약을 검증한다.
 */
export async function fetchCourseDetailWithBackendAccessToken(
  accessToken: string,
  courseId: string,
): Promise<CourseDetailResponse> {
  const response = await fetch(
    new URL(`/api/courses/${courseId}`, getBackendBaseUrl()),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BackendCourseRequestError(
      response.status,
      getBackendErrorMessage(json, "저장한 코스 상세를 불러오지 못했습니다."),
    );
  }

  return courseDetailResponseSchema.parse(json);
}

/**
 * 인증된 사용자의 저장 코스 수정 요청을 외부 백엔드에 전달한다.
 * access token 으로 Authorization 헤더를 만들고 수정 응답 계약을 검증한다.
 */
export async function updateCourseWithBackendAccessToken(
  accessToken: string,
  courseId: string,
  request: CourseUpdateRequest,
): Promise<CourseUpdateResponse> {
  const response = await fetch(
    new URL(`/api/courses/${courseId}`, getBackendBaseUrl()),
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(request),
      cache: "no-store",
    },
  );

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BackendCourseRequestError(
      response.status,
      getBackendErrorMessage(json, "저장한 코스를 수정하지 못했습니다."),
    );
  }

  return courseUpdateResponseSchema.parse(json);
}

/**
 * 인증된 사용자의 저장 코스 삭제 요청을 외부 백엔드에 전달한다.
 * access token 으로 Authorization 헤더를 만들고 void 삭제 응답 계약을 검증한다.
 */
export async function deleteCourseWithBackendAccessToken(
  accessToken: string,
  courseId: string,
): Promise<CourseDeleteResponse> {
  const response = await fetch(
    new URL(`/api/courses/${courseId}`, getBackendBaseUrl()),
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const json = await parseJsonResponse(response);

  if (!response.ok) {
    throw new BackendCourseRequestError(
      response.status,
      getBackendErrorMessage(json, "저장한 코스를 삭제하지 못했습니다."),
    );
  }

  return courseDeleteResponseSchema.parse(json);
}
