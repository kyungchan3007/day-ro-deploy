import { describe, expect, it } from "vitest";

import { isRetryExhausted } from "../model/retry-policy";

// issue #229: 결과 화면 재추천 소진 판단을 컨트롤러에서 model 로 옮긴다.
describe("isRetryExhausted", () => {
  it.each([0, -1])("잔여 %i회면 소진이다", (remaining) => {
    expect(isRetryExhausted(remaining)).toBe(true);
  });

  it.each([1, 5])("잔여 %i회면 소진이 아니다", (remaining) => {
    expect(isRetryExhausted(remaining)).toBe(false);
  });

  it("잔여 횟수를 모르면 소진으로 보지 않는다", () => {
    expect(isRetryExhausted(undefined)).toBe(false);
    expect(isRetryExhausted(null)).toBe(false);
  });
});
