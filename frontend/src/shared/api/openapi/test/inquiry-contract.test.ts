import { describe, expect, it } from "vitest";

import {
  inquiryCreateRequestSchema,
  inquiryCreateResponseSchema,
} from "../dayro.openapi";

/**
 * issue #224: FAQ 문의 API 계약 (BE PR#218 `InquiryCreateRequest` · `InquiryCreateResponse`).
 * 응답 형식은 운영 백엔드 실제 응답으로 확인한 값 기준.
 */
describe("inquiryCreateRequestSchema", () => {
  const valid = { subject: "코스 저장 문의", body: "저장이 안 돼요.", email: "user@dayro.dev" };

  it("제목 · 내용 · 이메일이 있으면 통과", () => {
    expect(inquiryCreateRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("백엔드 길이 제한: 제목 40 · 내용 3,000 · 이메일 254", () => {
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, subject: "가".repeat(40) }).success).toBe(true);
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, subject: "가".repeat(41) }).success).toBe(false);
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, body: "가".repeat(3000) }).success).toBe(true);
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, body: "가".repeat(3001) }).success).toBe(false);
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, email: `${"a".repeat(250)}@d.io` }).success).toBe(false);
  });

  it("빈 값 · 공백만 · 이메일 형식 아님 · 필드 누락은 실패 (백엔드 @NotBlank · @Email)", () => {
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, subject: "" }).success).toBe(false);
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, body: "   " }).success).toBe(false);
    expect(inquiryCreateRequestSchema.safeParse({ ...valid, email: "not-email" }).success).toBe(false);
    expect(inquiryCreateRequestSchema.safeParse({ subject: "a" }).success).toBe(false);
  });

  it("알 수 없는 키는 지운다", () => {
    const result = inquiryCreateRequestSchema.safeParse({ ...valid, extra: "x" });
    expect(result.success && result.data).toEqual(valid);
  });
});

describe("inquiryCreateResponseSchema", () => {
  it("성공 응답: data.inquiryId(UUID)", () => {
    const result = inquiryCreateResponseSchema.safeParse({
      success: true,
      message: "문의가 접수되었습니다.",
      data: { inquiryId: "3f9deddc-12a7-41a1-8102-00b23591e67d" },
    });
    expect(result.success).toBe(true);
  });

  it("inquiryId 가 UUID 가 아니거나 data 가 없으면 실패", () => {
    expect(
      inquiryCreateResponseSchema.safeParse({ success: true, message: "ok", data: { inquiryId: "1" } }).success,
    ).toBe(false);
    expect(inquiryCreateResponseSchema.safeParse({ success: true, message: "ok", data: null }).success).toBe(false);
  });
});
