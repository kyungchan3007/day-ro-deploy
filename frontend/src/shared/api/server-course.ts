import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { $ZodError } from "zod/v4/core";

import { ACCESS_TOKEN_COOKIE_NAME } from "../../features/auth/model/oauth";
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

  try {
    const payload = courseSaveRequestSchema.parse(await request.json());
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

    if (error instanceof $ZodError) {
      response = invalidCourseSaveRequestResponse();
    } else if (error instanceof BackendCourseRequestError) {
      response = failedCourseSaveResponse(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 502,
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
            error.status >= 400 && error.status < 500 ? error.status : 502,
          )
        : failedCourseListResponse("저장한 코스를 불러오지 못했습니다.");

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}

/**
 * `/saved` 같은 Server Component 화면에서 현재 사용자 저장 코스 목록을 읽는다.
 * proxy 가 복구한 access token 쿠키를 사용해 backend 목록 계약을 그대로 가져온다.
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
            error.status >= 400 && error.status < 500 ? error.status : 502,
          )
        : failedCourseDetailResponse("저장한 코스 상세를 불러오지 못했습니다.");

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}

/**
 * `/saved/[id]` 같은 Server Component 화면에서 현재 사용자 저장 코스 상세를 읽는다.
 * proxy 가 복구한 access token 쿠키를 사용해 backend 상세 계약을 그대로 가져온다.
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

  try {
    const payload = courseUpdateRequestSchema.parse(await request.json());
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

    if (error instanceof $ZodError) {
      response = invalidCourseUpdateRequestResponse();
    } else if (error instanceof BackendCourseRequestError) {
      response = failedCourseUpdateResponse(
        error.message,
        error.status >= 400 && error.status < 500 ? error.status : 502,
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
            error.status >= 400 && error.status < 500 ? error.status : 502,
          )
        : failedCourseDeleteResponse("저장한 코스를 삭제하지 못했습니다.");

    copyResponseCookies(cookieResponse, response);
    return response;
  }
}
