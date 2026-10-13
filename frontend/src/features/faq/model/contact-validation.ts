/**
 * 문의하기 폼 검증 규칙 — 순수 로직 (features/faq).
 *
 * 시안(HTML) 기준: 제목·내용 필수, 이메일 형식 검증, 내용 최대 3,000자.
 * 폼 컴포넌트는 이 함수들을 소비해 제출 활성화/글자수 상태를 계산한다.
 */

/** 문의 내용 최대 글자 수. */
export const CONTACT_BODY_MAX = 3000;
/** 문의 제목 최대 글자 수. */
export const CONTACT_SUBJECT_MAX = 40;

/** 시안과 동일한 느슨한 이메일 형식 검사(공백 없는 `_@_._`). */
const EMAIL_PATTERN = /\S+@\S+\.\S+/;

export interface ContactDraft {
  subject: string;
  body: string;
  email: string;
}

/** 제목 형식이 유효한지. */
export function isValidSubject(subject: string): boolean {
  const trimmed = subject.trim();
  return trimmed.length > 0 && trimmed.length <= CONTACT_SUBJECT_MAX;
}

/** 이메일 형식이 유효한지. */
export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/**
 * 제출 활성화 여부.
 * 제목·내용이 비어 있지 않고 이메일 형식이 맞아야 한다.
 */
export function isContactValid({ subject, body, email }: ContactDraft): boolean {
  return (
    isValidSubject(subject) &&
    body.trim().length > 0 &&
    isValidEmail(email)
  );
}

/**
 * 제목 입력을 최대 길이로 자르고, 한도 도달 여부를 함께 반환한다.
 * @returns value(최대 길이로 절단), atLimit(한도 도달로 경고 노출 대상)
 */
export function clampContactSubject(
  raw: string,
): { value: string; atLimit: boolean } {
  if (raw.length >= CONTACT_SUBJECT_MAX) {
    return { value: raw.slice(0, CONTACT_SUBJECT_MAX), atLimit: true };
  }
  return { value: raw, atLimit: false };
}

/**
 * 내용 입력을 최대 길이로 자르고, 한도 도달 여부를 함께 반환한다.
 * @returns value(최대 길이로 절단), atLimit(한도 도달로 경고 노출 대상)
 */
export function clampContactBody(raw: string): { value: string; atLimit: boolean } {
  if (raw.length >= CONTACT_BODY_MAX) {
    return { value: raw.slice(0, CONTACT_BODY_MAX), atLimit: true };
  }
  return { value: raw, atLimit: false };
}
