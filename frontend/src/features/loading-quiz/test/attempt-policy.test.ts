import { describe, expect, it } from "vitest";

import {
  CHOSUNG_QUIZ_MAX_RETRIES,
  CHOSUNG_QUIZ_REVEAL_MS,
  isQuizLocked,
  shouldRevealAnswer,
} from "../model/attempt-policy";

// issue #175 (QA #17): 오답 후 다시 입력은 최대 2회, 3번째 오답이면 정답 공개.
describe("shouldRevealAnswer", () => {
  it("다시 입력은 최대 2회까지 허용한다", () => {
    expect(CHOSUNG_QUIZ_MAX_RETRIES).toBe(2);
  });

  it.each([1, 2])("오답 %i회까지는 정답을 공개하지 않는다", (wrongCount) => {
    expect(shouldRevealAnswer(wrongCount)).toBe(false);
  });

  it.each([3, 4])("오답 %i회면 정답을 공개한다", (wrongCount) => {
    expect(shouldRevealAnswer(wrongCount)).toBe(true);
  });

  it("공개한 정답은 2초 보여준 뒤 다음 문제로 넘어간다", () => {
    expect(CHOSUNG_QUIZ_REVEAL_MS).toBe(2000);
  });
});

// issue #192: 잠금 조건을 훅 제출 가드와 카드가 함께 쓴다.
describe("isQuizLocked", () => {
  it("정답을 맞혔으면 잠근다", () => {
    expect(isQuizLocked(true, "correct")).toBe(true);
  });

  it("정답이 공개됐으면 잠근다", () => {
    expect(isQuizLocked(false, "revealed")).toBe(true);
  });

  it.each(["none", "wrong"] as const)("피드백 %s 이고 못 맞혔으면 입력을 받는다", (feedback) => {
    expect(isQuizLocked(false, feedback)).toBe(false);
  });
});
