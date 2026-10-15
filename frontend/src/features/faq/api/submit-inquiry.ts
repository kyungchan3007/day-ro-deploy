import { BFF_ENDPOINTS } from "../../../shared/api/endpoints";
import {
  inquiryCreateResponseSchema,
  type InquiryCreateRequest,
  type InquiryCreateResponse,
} from "../../../shared/api/openapi/dayro.openapi";

export class InquiryRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
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
    throw new InquiryRequestError(response.status, "문의를 보내지 못했습니다.");
  }
  return inquiryCreateResponseSchema.parse(json);
}
