import { describe, expect, it } from "vitest";

import {
  isRegionSelectionValid,
  keepRegionSelectionForQuery,
  keepRegionSelectionInGroup,
  restoreRegionQuery,
} from "../model/region-selection";
import type { SituationRegionValue } from "../model/types";

const seochon: SituationRegionValue = {
  districtId: "11011",
  label: "서촌",
  dong: "청운효자동",
  categoryId: "종로구",
  categoryLabel: "종로구",
};

// issue #168 (QA #3): 이전 구의 동이 남아 다음 단계로 넘어가면 안 된다.
describe("isRegionSelectionValid", () => {
  it("현재 구에 속한 동을 골랐으면 유효하다", () => {
    expect(isRegionSelectionValid(seochon, "종로구")).toBe(true);
  });

  it("동을 고르지 않았으면 유효하지 않다", () => {
    expect(isRegionSelectionValid(undefined, "종로구")).toBe(false);
  });

  it("선택한 동이 현재 구에 속하지 않으면 유효하지 않다", () => {
    expect(isRegionSelectionValid(seochon, "성동구")).toBe(false);
  });

  it("구를 '선택 안 함'으로 바꾸면 이전 구의 동은 유효하지 않다", () => {
    expect(isRegionSelectionValid(seochon, undefined)).toBe(false);
  });
});

describe("keepRegionSelectionInGroup", () => {
  it("다른 구로 바꾸면 선택을 해제한다", () => {
    expect(keepRegionSelectionInGroup(seochon, "성동구")).toBeUndefined();
  });

  it("'선택 안 함'으로 바꾸면 선택을 해제한다", () => {
    expect(keepRegionSelectionInGroup(seochon, undefined)).toBeUndefined();
  });

  it("같은 구를 다시 고르면 선택을 유지한다", () => {
    expect(keepRegionSelectionInGroup(seochon, "종로구")).toBe(seochon);
  });

  it("선택이 없으면 그대로 없다", () => {
    expect(keepRegionSelectionInGroup(undefined, "성동구")).toBeUndefined();
  });
});

describe("keepRegionSelectionForQuery", () => {
  it("동네 검색어를 지우면 선택을 해제한다", () => {
    expect(keepRegionSelectionForQuery(seochon, "")).toBeUndefined();
  });

  it("공백만 남겨도 지운 것으로 본다", () => {
    expect(keepRegionSelectionForQuery(seochon, "   ")).toBeUndefined();
  });

  // issue #208 (QA #2): 동네 칸 글자 = 고른 동 이름. 글자를 고치면 이전 선택으로 진행되면 안 된다.
  it("검색어를 고쳐 동 이름과 달라지면 선택을 해제한다", () => {
    expect(keepRegionSelectionForQuery(seochon, "서")).toBeUndefined();
    expect(keepRegionSelectionForQuery(seochon, "서촌동")).toBeUndefined();
  });

  it("검색어가 고른 동 이름 그대로면 선택을 유지한다", () => {
    expect(keepRegionSelectionForQuery(seochon, "서촌")).toBe(seochon);
    expect(keepRegionSelectionForQuery(seochon, " 서촌 ")).toBe(seochon);
  });
});

describe("restoreRegionQuery", () => {
  it("뒤로 와서 복원하면 선택한 동 이름을 검색어로 채운다", () => {
    expect(restoreRegionQuery(seochon)).toBe("서촌");
  });

  it("선택이 없으면 빈 검색어다", () => {
    expect(restoreRegionQuery(undefined)).toBe("");
  });
});
