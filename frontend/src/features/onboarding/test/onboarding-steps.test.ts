import { describe, expect, it } from "vitest";

import { isLastSlide, moveNext, movePrev, swipeTarget } from "../model/onboarding-steps";

describe("온보딩 장 이동 (issue #230)", () => {
  it("다음: 마지막 장 전까지 다음 장, 마지막 장에서 홈", () => {
    expect(moveNext(0, 3)).toEqual({ type: "slide", index: 1 });
    expect(moveNext(1, 3)).toEqual({ type: "slide", index: 2 });
    expect(moveNext(2, 3)).toEqual({ type: "finish" });
  });

  it("이전: 첫 장에서 시작 화면", () => {
    expect(movePrev(2)).toEqual({ type: "slide", index: 1 });
    expect(movePrev(0)).toEqual({ type: "start" });
  });

  it("스와이프: 50px 이상만 넘기고 양 끝에서는 멈춤", () => {
    expect(swipeTarget(0, 3, -50)).toBe(1);
    expect(swipeTarget(0, 3, -49)).toBe(0);
    expect(swipeTarget(1, 3, 60)).toBe(0);
    expect(swipeTarget(0, 3, 80)).toBe(0);
    expect(swipeTarget(2, 3, -80)).toBe(2);
  });

  it("세로가 더 큰 손짓(스크롤)은 넘기지 않음 (검증 리포트 F2)", () => {
    expect(swipeTarget(0, 3, -60, -300)).toBe(0);
    expect(swipeTarget(0, 3, -60, 60)).toBe(0);
    expect(swipeTarget(0, 3, -80, 30)).toBe(1);
  });

  it("마지막 장 여부", () => {
    expect(isLastSlide(2, 3)).toBe(true);
    expect(isLastSlide(1, 3)).toBe(false);
  });
});
