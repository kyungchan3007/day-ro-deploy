import { describe, expect, it } from "vitest";

import {
  clampContactSubject,
  clampContactBody,
  CONTACT_BODY_MAX,
  CONTACT_SUBJECT_MAX,
  isContactValid,
  isValidEmail,
} from "../model/contact-validation";

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
});
