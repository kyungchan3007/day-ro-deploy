import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getBackendBaseUrl } from "./backend-base-url";
import { bffErrorResponse, readBackendJson, toBackendApiError } from "./backend-error";
import { readClientIp } from "./client-ip";
import {
  inquiryCreateRequestSchema,
  inquiryCreateResponseSchema,
  type InquiryCreateRequest,
  type InquiryCreateResponse,
} from "./openapi/dayro.openapi";
import { readAccessTokenCookie } from "./server-auth";

const INQUIRY_FALLBACK_MESSAGE = "문의를 보내지 못했습니다.";

/**
 * 외부 백엔드 `POST /api/inquiries` 호출 (BE PR#218, issue #224).
 * - 로그인 상태면 access token 을 실어 회원 문의로 저장되게 한다(비회원 허용).
 * - 접속 IP 를 X-Forwarded-For 로 넘겨 백엔드 IP당 시간당 5건 제한이 사용자 기준으로 걸리게 한다.
 */
export async function createBackendInquiry(
  payload: InquiryCreateRequest,
  options: { accessToken?: string | null; clientIp?: string | null },
): Promise<InquiryCreateResponse> {
  const response = await fetch(new URL("/api/inquiries", getBackendBaseUrl()), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options.clientIp ? { "X-Forwarded-For": options.clientIp } : {}),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await readBackendJson(response);
  if (!response.ok) {
    throw toBackendApiError(response, json, INQUIRY_FALLBACK_MESSAGE);
  }
  return inquiryCreateResponseSchema.parse(json);
}

/**
 * 문의 BFF 요청 처리: 입력 검증(400) → 백엔드 전달 → 응답 계약 검증.
 * 입력 검증과 백엔드 호출을 분리해, 백엔드 응답 계약 불일치를 입력 오류로 내보내지 않는다(.agents/guides/bff.md).
 */
export async function submitInquiryFromRequest(request: NextRequest) {
  const parsed = inquiryCreateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: "잘못된 문의 요청입니다.", data: null },
      { status: 400 },
    );
  }

  try {
    const result = await createBackendInquiry(parsed.data, {
      accessToken: readAccessTokenCookie(request),
      clientIp: readClientIp(request.headers),
    });
    return NextResponse.json(result);
  } catch (error) {
    return bffErrorResponse(error, INQUIRY_FALLBACK_MESSAGE);
  }
}
