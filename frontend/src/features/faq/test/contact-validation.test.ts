import { describe, expect, it } from "vitest";

import {
  clampContactSubject,
  clampContactBody,
  CONTACT_BODY_MAX,
  CONTACT_SUBJECT_MAX,
  isContactValid,
  isValidEmail,
} from "../model/contact-validation";
import { INQUIRY_LIMITS } from "@/shared/api/openapi/dayro.openapi";

describe("contact validation", () => {
  it("accepts non-empty subject/body with a basic email shape", () => {
    expect(
      isContactValid({
        subject: "문의 제목",
        body: "문의 내용",
        email: "hello@example.com",
      }),
    ).toBe(true);
  });

  it("rejects blank fields and malformed email", () => {
    expect(
      isContactValid({
        subject: " ",
        body: "문의 내용",
        email: "hello@example.com",
      }),
    ).toBe(false);

    expect(
      isContactValid({
        subject: "문의 제목",
        body: " ",
        email: "hello@example.com",
      }),
    ).toBe(false);

    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("rejects subjects longer than the domain limit", () => {
    expect(
      isContactValid({
        subject: "제".repeat(CONTACT_SUBJECT_MAX + 1),
        body: "문의 내용",
        email: "hello@example.com",
      }),
    ).toBe(false);
  });

  it("clamps subject input to 40 chars and marks the limit reached", () => {
    const overLimit = "제".repeat(CONTACT_SUBJECT_MAX + 5);

    expect(clampContactSubject(overLimit)).toEqual({
      value: "제".repeat(CONTACT_SUBJECT_MAX),
      atLimit: true,
    });
  });

  it("clamps body input to 3000 chars and marks the limit reached", () => {
    const overLimit = "a".repeat(CONTACT_BODY_MAX + 10);

    expect(clampContactBody(overLimit)).toEqual({
      value: "a".repeat(CONTACT_BODY_MAX),
      atLimit: true,
    });
  });

  it("does not mark shorter subjects as limited", () => {
    expect(clampContactSubject("문의 제목")).toEqual({
      value: "문의 제목",
      atLimit: false,
    });
  });

  // 이메일 254자 제한은 zod 계약에만 있었다 — 폼도 같은 상수로 막는다(issue #229).
  it("accepts emails up to 254 chars and rejects longer ones", () => {
    const domain = "@example.com";
    const atLimit = "a".repeat(INQUIRY_LIMITS.emailMax - domain.length) + domain;

    expect(INQUIRY_LIMITS.emailMax).toBe(254);
    expect(atLimit).toHaveLength(254);
    expect(isValidEmail(atLimit)).toBe(true);
    expect(isValidEmail("a" + atLimit)).toBe(false);
  });
});
