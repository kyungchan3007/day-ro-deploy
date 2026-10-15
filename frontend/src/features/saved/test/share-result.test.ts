import { describe, expect, it } from "vitest";

import { canUseSystemShare, classifyShareError } from "../lib/share-result";

// issue #183 (QA #12 · #19)
describe("classifyShareError", () => {
  it("공유 창을 닫으면(AbortError) 취소로 본다", () => {
    expect(classifyShareError(Object.assign(new Error(), { name: "AbortError" }))).toBe("cancelled");
  });

  it.each(["NotAllowedError", "TypeError", "DataError"])("%s 는 실패로 본다", (name) => {
    expect(classifyShareError(Object.assign(new Error(), { name }))).toBe("failed");
  });

  it("에러 객체가 아니어도 실패로 본다", () => {
    expect(classifyShareError("boom")).toBe("failed");
  });
});

describe("canUseSystemShare", () => {
  it("navigator.share 가 있으면 시스템 공유를 쓸 수 있다", () => {
    expect(canUseSystemShare({ share: async () => undefined })).toBe(true);
  });

  it("없으면 쓸 수 없다", () => {
    expect(canUseSystemShare({} as Pick<Navigator, "share">)).toBe(false);
    expect(canUseSystemShare(undefined)).toBe(false);
  });
});
