"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  clampContactSubject,
  clampContactBody,
  isContactValid,
  type ContactDraft,
} from "../model/contact-validation";

/**
 * 문의하기 폼 상태/전이 훅.
 *
 * ContactForm UI 에서 입력 상태, 글자수 제한, 완료 모달 open/close,
 * 완료 후 FAQ 복귀 정책을 분리해 렌더링 책임과 orchestration 책임을 나눈다.
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

  /**
   * 특정 필드 값을 갱신한다.
   * body 는 최대 길이를 강제하고 경고 노출 여부를 함께 계산한다.
   */
  const setField = (field: keyof ContactDraft, value: string) => {
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

  /** 문의 폼 제출. API 연동 전까지는 UI 완료 상태만 연다. */
  const submit = () => {
    if (!isContactValid(draft)) {
      return;
    }

    setDoneOpen(true);
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
    valid: isContactValid(draft),
    setField,
    submit,
    closeDone,
  };
}
