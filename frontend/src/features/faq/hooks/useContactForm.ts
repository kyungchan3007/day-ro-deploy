"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  clampContactSubject,
  clampContactBody,
  isContactValid,
  type ContactDraft,
} from "../model/contact-validation";
import { getInquiryErrorMessage, toInquiryRequest } from "../model/inquiry-submit";
import { InquiryRequestError, requestInquiry } from "../api/submit-inquiry";

/**
 * 문의하기 폼 상태/전이 훅.
 *
 * ContactForm UI 에서 입력 상태, 글자수 제한, 완료 모달 open/close,
 * 완료 후 FAQ 복귀 정책을 분리해 렌더링 책임과 orchestration 책임을 나눈다.
 * 제출은 문의 API 로 보낸 뒤 성공하면 완료 모달, 실패하면 입력은 그대로 두고 안내 문구(issue #224).
 */
export function useContactForm() {
  const router = useRouter();

  const [draft, setDraft] = useState<ContactDraft>({
    subject: "",
    body: "",
    email: "",
  });
  const [bodyAtLimit, setBodyAtLimit] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 특정 필드 값을 갱신한다.
   * body 는 최대 길이를 강제하고 경고 노출 여부를 함께 계산한다.
   */
  const setField = (field: keyof ContactDraft, value: string) => {
    // 고치기 시작하면 이전 실패 안내를 지운다.
    setErrorMessage(null);
    if (field === "subject") {
      const nextSubject = clampContactSubject(value);
      setDraft((prev) => ({ ...prev, subject: nextSubject.value }));
      return;
    }

    if (field === "body") {
      const nextBody = clampContactBody(value);
      setDraft((prev) => ({ ...prev, body: nextBody.value }));
      setBodyAtLimit(nextBody.atLimit);
      return;
    }

    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  /** 문의 폼 제출. 보내는 중에는 다시 누를 수 없고, 성공해야 완료 모달을 연다. */
  const submit = async () => {
    if (!isContactValid(draft) || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await requestInquiry(toInquiryRequest(draft));
      setDoneOpen(true);
    } catch (error) {
      setErrorMessage(getInquiryErrorMessage(error instanceof InquiryRequestError ? error.status : null));
    } finally {
      setSubmitting(false);
    }
  };

  /** 완료 모달을 닫고 FAQ 목록으로 돌아간다. */
  const closeDone = () => {
    setDoneOpen(false);
    router.push("/faq");
  };

  return {
    draft,
    bodyAtLimit,
    doneOpen,
    submitting,
    errorMessage,
    valid: isContactValid(draft),
    setField,
    submit,
    closeDone,
  };
}
