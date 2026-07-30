import { describe, expect, it } from "vitest";
import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import {
  MAX_SELECTABLE_PLACES,
  isSelectionFull,
  isSelectionValid,
  selectionHint,
  selectionOrderOf,
  toggleSelection,
} from "../model/course-selection";

function place(id: string): PlaceCandidate {
  return { placeId: id, name: `장소-${id}`, category: "카페", district: "종로구" };
}

const [p1, p2, p3, p4, p5, p6] = ["1", "2", "3", "4", "5", "6"].map(place);

describe("course-selection rules", () => {
  it("탭 순서대로 선택을 누적한다", () => {
    let selected: PlaceCandidate[] = [];
    selected = toggleSelection(selected, p1);
    selected = toggleSelection(selected, p2);

    expect(selected.map((p) => p.placeId)).toEqual(["1", "2"]);
    expect(selectionOrderOf(selected, "1")).toBe(1);
    expect(selectionOrderOf(selected, "2")).toBe(2);
    expect(selectionOrderOf(selected, "9")).toBeUndefined();
  });

  it("다시 탭하면 해제하고 순서를 앞당겨 재정렬한다", () => {
    let selected = [p1, p2, p3];
    selected = toggleSelection(selected, p2); // 2번째 해제

    expect(selected.map((p) => p.placeId)).toEqual(["1", "3"]);
    // 3번이 2번째로 당겨진다.
    expect(selectionOrderOf(selected, "3")).toBe(2);
  });

  it("최대 개수를 넘으면 더 추가하지 않는다", () => {
    let selected = [p1, p2, p3, p4, p5];
    expect(isSelectionFull(selected.length)).toBe(true);

    selected = toggleSelection(selected, p6);
    expect(selected).toHaveLength(MAX_SELECTABLE_PLACES);
    expect(selectionOrderOf(selected, "6")).toBeUndefined();
  });

  it("CTA 는 최소 4개부터 활성화된다", () => {
    expect(isSelectionValid(3)).toBe(false);
    expect(isSelectionValid(4)).toBe(true);
    expect(isSelectionValid(5)).toBe(true);
  });

  it("선택 상태에 따라 hint 문구가 바뀐다", () => {
    expect(selectionHint(0)).toBe("최소 4곳을 선택해야해요");
    expect(selectionHint(2)).toBe("다시 탭하면 선택이 해제돼요");
  });
});
