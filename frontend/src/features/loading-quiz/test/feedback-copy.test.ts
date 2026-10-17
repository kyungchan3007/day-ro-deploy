import { describe, expect, it } from "vitest";

import { getQuizFeedbackCopy } from "../model/feedback-copy";

// issue #192: 피드백 상태 → 문구 선택을 카드 밖(model)에서 한다.
describe("getQuizFeedbackCopy", () => {
  it("피드백이 없으면 문구도 없다", () => {
    expect(getQuizFeedbackCopy("none", null)).toEqual({ message: null, detail: null });
  });

  it("정답 · 오답 문구", () => {
    expect(getQuizFeedbackCopy("correct", null)).toEqual({ message: "정답! 🎉", detail: null });
    expect(getQuizFeedbackCopy("wrong", null)).toEqual({ message: "오답입니다", detail: null });
  });

  it("정답 공개 시 정답과 다음 문제 안내를 함께 보여준다 (issue #175)", () => {
    expect(getQuizFeedbackCopy("revealed", "빙수")).toEqual({
      message: "정답은 ‘빙수’이에요",
      detail: "곧 다음 문제로 넘어가요",
    });
  });

  it("공개 상태인데 정답이 없으면 아무것도 보여주지 않는다", () => {
    expect(getQuizFeedbackCopy("revealed", null)).toEqual({ message: null, detail: null });
  });
});
