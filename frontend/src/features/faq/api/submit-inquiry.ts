import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import {
  inquiryCreateResponseSchema,
  type InquiryCreateRequest,
  type InquiryCreateResponse,
} from "../../../shared/api/openapi/dayro.openapi";

export class InquiryRequestError extends Error {
  status: number;

  // 화면 문구는 model(getInquiryErrorMessage)이 status 로 고른다 — 이 message 는 화면에 쓰지 않는다(issue #229).
  constructor(status: number) {
    super(`POST ${BFF_ENDPOINTS.inquiries} failed: ${status}`);
    this.name = "InquiryRequestError";
    this.status = status;
  }
}

/**
 * 문의하기 BFF(`POST /api/inquiries`)를 호출한다 (issue #224).
 * 실패하면 상태 코드를 담은 `InquiryRequestError` — 화면 문구는 model 이 상태로 고른다.
 */
export async function requestInquiry(request: InquiryCreateRequest): Promise<InquiryCreateResponse> {
  const response = await fetch(BFF_ENDPOINTS.inquiries, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  const json = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new InquiryRequestError(response.status);
  }
  return inquiryCreateResponseSchema.parse(json);
}
