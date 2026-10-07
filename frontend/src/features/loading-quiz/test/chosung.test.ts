import { describe, expect, it } from "vitest";

import { toChoseong } from "../model/chosung";
import { isCorrectAnswer } from "../model/judge";
import { CHOSUNG_QUIZ_ITEMS } from "../model/quiz-data";

describe("loading quiz model", () => {
  it("builds choseong from Hangul answers while preserving spaces", () => {
    expect(toChoseong("마카롱 카페")).toBe("ㅁㅋㄹ ㅋㅍ");
    expect(toChoseong("한강공원")).toBe("ㅎㄱㄱㅇ");
  });

  it("keeps non-Hangul characters untouched", () => {
    expect(toChoseong("A/B 테스트")).toBe("A/B ㅌㅅㅌ");
  });

  it("accepts answers with trimmed outer whitespace only", () => {
    expect(isCorrectAnswer("  마카롱  ", "마카롱")).toBe(true);
    expect(isCorrectAnswer("마 카 롱", "마카롱")).toBe(false);
    expect(isCorrectAnswer("", "마카롱")).toBe(false);
  });

  it("ships the expected 30 quiz items", () => {
    expect(CHOSUNG_QUIZ_ITEMS).toHaveLength(30);
  });
});
