import "server-only";

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
import { getBackendBaseUrl } from "./backend-base-url";
import { BackendApiError, readBackendJson, toBackendApiError } from "./backend-error";

/** 저장 코스 백엔드 오류. 공통 `BackendApiError`와 같으며 기존 import 이름을 유지한다. */
export class BackendCourseRequestError extends BackendApiError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "BackendCourseRequestError";
  }
}

/** 백엔드 오류 응답을 저장 코스 오류로 바꾼다(문구·상태 규칙은 `toBackendApiError`와 같다). */
function toCourseRequestError(response: Response, json: unknown, fallbackMessage: string) {
  const error = toBackendApiError(response, json, fallbackMessage);
  return new BackendCourseRequestError(error.status, error.message);
}

/** 백엔드 저장 코스 id 형식(UUID). */
const COURSE_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 저장 코스 상세·수정·삭제 경로를 만든다.
 * id 를 UUID 형식으로 검증하고 인코딩해, `../auth/withdraw` 같은 값이 다른 백엔드 API 경로로
 * 정규화되는 것을 막는다(issue #139 S3). 형식이 아니면 400 으로 거절한다.
 * @param courseId 라우트 파라미터로 받은 저장 코스 id.
 */
export function buildCourseDetailPath(courseId: string): string {
  if (!COURSE_ID_PATTERN.test(courseId)) {
    throw new BackendCourseRequestError(400, "잘못된 코스 요청입니다.");
  }
  return `/api/courses/${encodeURIComponent(courseId)}`;
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

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toCourseRequestError(response, json, "코스 저장에 실패했습니다.");
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

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toCourseRequestError(response, json, "저장한 코스를 불러오지 못했습니다.");
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
    new URL(buildCourseDetailPath(courseId), getBackendBaseUrl()),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toCourseRequestError(response, json, "저장한 코스 상세를 불러오지 못했습니다.");
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
    new URL(buildCourseDetailPath(courseId), getBackendBaseUrl()),
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

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toCourseRequestError(response, json, "저장한 코스를 수정하지 못했습니다.");
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
    new URL(buildCourseDetailPath(courseId), getBackendBaseUrl()),
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    },
  );

  const json = await readBackendJson(response);

  if (!response.ok) {
    throw toCourseRequestError(response, json, "저장한 코스를 삭제하지 못했습니다.");
  }

  return courseDeleteResponseSchema.parse(json);
}
