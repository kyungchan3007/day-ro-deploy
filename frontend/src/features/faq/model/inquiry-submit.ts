import { faqStatic } from "@/shared/static/faq";
import type { InquiryCreateRequest } from "@/shared/api/openapi/dayro.openapi";

import type { ContactDraft } from "./contact-validation";

/** 폼 입력 → 문의 요청 본문. 제목 · 이메일 앞뒤 공백은 정리하고 내용은 그대로 보낸다(줄바꿈 보존). */
export function toInquiryRequest(draft: ContactDraft): InquiryCreateRequest {
  return { subject: draft.subject.trim(), body: draft.body, email: draft.email.trim() };
}

/**
 * 문의 전송 실패 상태 → 안내 문구 (issue #224).
 * 429 빈도 제한(IP당 시간당 5건 · 하루 전체 100건) · 400 입력 오류 · 그 밖(네트워크 · 5xx)은 재시도 안내.
 * 백엔드 400 문구는 영어(`must not be blank`)라 쓰지 않는다.
 */
export function getInquiryErrorMessage(status: number | null): string {
  const { errors } = faqStatic.contact;
  if (status === 429) {
    return errors.tooMany;
  }
  if (status === 400) {
    return errors.invalid;
  }
  return errors.failed;
}
