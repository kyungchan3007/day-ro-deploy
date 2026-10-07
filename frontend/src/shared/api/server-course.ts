import "server-only";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE_NAME } from "./auth-cookies";
import {
  courseSaveRequestSchema,
  courseUpdateRequestSchema,
} from "./openapi/dayro.openapi";
import { readAccessTokenCookie } from "./server-auth-cookies";
import { resolveAuthSessionFromRequest } from "./server-auth-session";
import {
  BackendCourseRequestError,
  deleteCourseWithBackendAccessToken,
  fetchCourseDetailWithBackendAccessToken,
  fetchCoursesWithBackendAccessToken,
  saveCourseWithBackendAccessToken,
  updateCourseWithBackendAccessToken,
} from "./server-course-client";
import { copyResponseCookies } from "./server-response-cookies";
import { toBffErrorStatus } from "./backend-error";

function unauthorizedCourseSaveResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "로그인이 필요합니다.",
      data: null,
    },
    { status: 401 },
  );
}

function invalidCourseSaveRequestResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "잘못된 코스 저장 요청입니다.",
      data: null,
    },
    { status: 400 },
  );
}

function failedCourseSaveResponse(message: string, status = 502) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status },
  );
}

function failedCourseListResponse(message: string, status = 502) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status },
  );
}

function failedCourseDetailResponse(message: string, status = 502) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status },
  );
}

function invalidCourseUpdateRequestResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "잘못된 코스 수정 요청입니다.",
      data: null,
    },
    { status: 400 },
  );
}

function failedCourseUpdateResponse(message: string, status = 502) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status },
  );
}

function failedCourseDeleteResponse(message: string, status = 502) {
  return NextResponse.json(
    {
      success: false,
      message,
      data: null,
    },
    { status },
  );
}

/**
 * 코스 저장 BFF 요청을 처리한다.
 * 세션 해석, payload 검증, 백엔드 저장 transport 호출과 에러 응답 정규화를 함께 맡는다.
 */
export async function saveCourseFromRequest(request: NextRequest) {
  const cookieResponse = new NextResponse();
  const session = await resolveAuthSessionFromRequest(request, cookieResponse);

  if (!session.authenticated || !session.user) {
    const response = unauthorizedCourseSaveResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }

  // 입력 검증과 백엔드 호출을 분리한다. 백엔드 응답 계약 불일치(ZodError)를 입력 오류(400)로 오인하지 않기 위함이다(issue #139 S8).
  const parsed = courseSaveRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const response = invalidCourseSaveRequestResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }
  const payload = parsed.data;

  try {
    const accessToken =
      cookieResponse.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ??
      readAccessTokenCookie(request);

    if (!accessToken) {
      const response = unauthorizedCourseSaveResponse();
      copyResponseCookies(cookieResponse, response);
      return response;
    }

    const result = await saveCourseWithBackendAccessToken(accessToken, payload);
    const response = NextResponse.json(result);
    copyResponseCookies(cookieResponse, response);
    return response;
  } catch (error) {
    let response: NextResponse;

    if (error instanceof BackendCourseRequestError) {
      response = failedCourseSaveResponse(
        error.message,
        toBffErrorStatus(error.status),
      );
    } else {
      response = failedCourseSaveResponse("코스 저장에 실패했습니다.");
    }

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}

/**
 * 코스 목록 BFF 요청을 처리한다.
 * 세션 해석과 backend 목록 transport 호출, 에러 응답 정규화를 Route Handler 밖으로 분리한다.
 */
export async function listCoursesFromRequest(request: NextRequest) {
  const cookieResponse = new NextResponse();
  const session = await resolveAuthSessionFromRequest(request, cookieResponse);

  if (!session.authenticated || !session.user) {
    const response = unauthorizedCourseSaveResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }

  try {
    const accessToken =
      cookieResponse.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ??
      readAccessTokenCookie(request);

    if (!accessToken) {
      const response = unauthorizedCourseSaveResponse();
      copyResponseCookies(cookieResponse, response);
      return response;
    }

    const result = await fetchCoursesWithBackendAccessToken(accessToken);
    const response = NextResponse.json(result);
    copyResponseCookies(cookieResponse, response);
    return response;
  } catch (error) {
    const response =
      error instanceof BackendCourseRequestError
        ? failedCourseListResponse(
            error.message,
            toBffErrorStatus(error.status),
          )
        : failedCourseListResponse("저장한 코스를 불러오지 못했습니다.");

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}

/**
 * `/saved` 같은 Server Component 화면에서 현재 사용자 저장 코스 목록을 읽는다.
 * 보호 화면 가드(세션 복구 경로 포함)를 지난 access token 쿠키를 사용해 backend 목록 계약을 그대로 가져온다.
 */
export async function getCoursesForServerComponent() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null;

  if (!accessToken) {
    throw new Error("로그인이 필요합니다.");
  }

  return fetchCoursesWithBackendAccessToken(accessToken);
}

/**
 * 코스 상세 BFF 요청을 처리한다.
 * 세션 해석과 backend 상세 transport 호출, 에러 응답 정규화를 Route Handler 밖으로 분리한다.
 */
export async function getCourseDetailFromRequest(
  request: NextRequest,
  courseId: string,
) {
  const cookieResponse = new NextResponse();
  const session = await resolveAuthSessionFromRequest(request, cookieResponse);

  if (!session.authenticated || !session.user) {
    const response = unauthorizedCourseSaveResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }

  try {
    const accessToken =
      cookieResponse.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ??
      readAccessTokenCookie(request);

    if (!accessToken) {
      const response = unauthorizedCourseSaveResponse();
      copyResponseCookies(cookieResponse, response);
      return response;
    }

    const result = await fetchCourseDetailWithBackendAccessToken(
      accessToken,
      courseId,
    );
    const response = NextResponse.json(result);
    copyResponseCookies(cookieResponse, response);
    return response;
  } catch (error) {
    const response =
      error instanceof BackendCourseRequestError
        ? failedCourseDetailResponse(
            error.message,
            toBffErrorStatus(error.status),
          )
        : failedCourseDetailResponse("저장한 코스 상세를 불러오지 못했습니다.");

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}

/**
 * `/saved/[id]` 같은 Server Component 화면에서 현재 사용자 저장 코스 상세를 읽는다.
 * 보호 화면 가드(세션 복구 경로 포함)를 지난 access token 쿠키를 사용해 backend 상세 계약을 그대로 가져온다.
 */
export async function getCourseDetailForServerComponent(courseId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value ?? null;

  if (!accessToken) {
    throw new Error("로그인이 필요합니다.");
  }

  return fetchCourseDetailWithBackendAccessToken(accessToken, courseId);
}

/**
 * 코스 수정 BFF 요청을 처리한다.
 * 세션 해석, payload 검증, backend 수정 transport 호출과 에러 응답 정규화를 함께 맡는다.
 */
export async function updateCourseFromRequest(
  request: NextRequest,
  courseId: string,
) {
  const cookieResponse = new NextResponse();
  const session = await resolveAuthSessionFromRequest(request, cookieResponse);

  if (!session.authenticated || !session.user) {
    const response = unauthorizedCourseSaveResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }

  // 입력 검증과 백엔드 호출을 분리한다(저장과 같은 이유, issue #139 S8).
  const parsed = courseUpdateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const response = invalidCourseUpdateRequestResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }
  const payload = parsed.data;

  try {
    const accessToken =
      cookieResponse.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ??
      readAccessTokenCookie(request);

    if (!accessToken) {
      const response = unauthorizedCourseSaveResponse();
      copyResponseCookies(cookieResponse, response);
      return response;
    }

    const result = await updateCourseWithBackendAccessToken(
      accessToken,
      courseId,
      payload,
    );
    const response = NextResponse.json(result);
    copyResponseCookies(cookieResponse, response);
    return response;
  } catch (error) {
    let response: NextResponse;

    if (error instanceof BackendCourseRequestError) {
      response = failedCourseUpdateResponse(
        error.message,
        toBffErrorStatus(error.status),
      );
    } else {
      response = failedCourseUpdateResponse("저장한 코스를 수정하지 못했습니다.");
    }

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}

/**
 * 코스 삭제 BFF 요청을 처리한다.
 * 세션 해석, backend 삭제 transport 단일 호출과 에러 응답 정규화를 맡는다.
 */
export async function deleteCourseFromRequest(
  request: NextRequest,
  courseId: string,
) {
  const cookieResponse = new NextResponse();
  const session = await resolveAuthSessionFromRequest(request, cookieResponse);

  if (!session.authenticated || !session.user) {
    const response = unauthorizedCourseSaveResponse();
    copyResponseCookies(cookieResponse, response);
    return response;
  }

  try {
    const accessToken =
      cookieResponse.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value ??
      readAccessTokenCookie(request);

    if (!accessToken) {
      const response = unauthorizedCourseSaveResponse();
      copyResponseCookies(cookieResponse, response);
      return response;
    }

    const result = await deleteCourseWithBackendAccessToken(
      accessToken,
      courseId,
    );
    const response = NextResponse.json(result);
    copyResponseCookies(cookieResponse, response);
    return response;
  } catch (error) {
    const response =
      error instanceof BackendCourseRequestError
        ? failedCourseDeleteResponse(
            error.message,
            toBffErrorStatus(error.status),
          )
        : failedCourseDeleteResponse("저장한 코스를 삭제하지 못했습니다.");

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}
