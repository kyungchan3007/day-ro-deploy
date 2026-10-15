import { describe, expect, it } from "vitest";

import { getInquiryErrorMessage, toInquiryRequest } from "../model/inquiry-submit";

/** issue #224: 문의 전송 요청 본문 · 실패 문구. */
describe("toInquiryRequest", () => {
  it("제목 · 이메일 앞뒤 공백을 정리하고 내용은 줄바꿈까지 그대로", () => {
    expect(toInquiryRequest({ subject: "  저장 문의 ", body: " 첫 줄\n둘째 줄 ", email: " a@b.co " })).toEqual({
      subject: "저장 문의",
      body: " 첫 줄\n둘째 줄 ",
      email: "a@b.co",
    });
  });
});

describe("getInquiryErrorMessage", () => {
  it("429 는 잠시 후 다시 시도 안내", () => {
    expect(getInquiryErrorMessage(429)).toBe("문의가 많아 잠시 후 다시 시도해주세요.");
  });

  it("400 은 입력 확인 안내 (백엔드 영어 문구는 쓰지 않음)", () => {
    expect(getInquiryErrorMessage(400)).toBe("입력한 내용을 다시 확인해주세요.");
  });

  it("그 밖(5xx · 네트워크)은 재시도 안내", () => {
    expect(getInquiryErrorMessage(502)).toBe("문의를 보내지 못했어요. 잠시 후 다시 시도해주세요.");
    expect(getInquiryErrorMessage(null)).toBe("문의를 보내지 못했어요. 잠시 후 다시 시도해주세요.");
  });
});
