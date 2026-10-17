import { describe, expect, it } from "vitest";

import {
  PLACE_COUNT_DEFAULT,
  PLACE_COUNT_MAX,
  PLACE_COUNT_MIN,
  resolvePlaceCount,
  stepPlaceCount,
} from "../model/place-count";
import { buildSituationRequest } from "../model/request";
import { parseCourseFlowSnapshot } from "../model/course-flow";

describe("place count (QA #9 · issue #247)", () => {
  it("범위는 2~5곳 · 기본 3곳 (시안)", () => {
    expect([PLACE_COUNT_MIN, PLACE_COUNT_MAX, PLACE_COUNT_DEFAULT]).toEqual([2, 5, 3]);
  });

  it("저장값이 없거나 정수가 아니면 기본 3곳, 범위 밖이면 가까운 끝", () => {
    expect(resolvePlaceCount(undefined)).toBe(3);
    expect(resolvePlaceCount(2.5)).toBe(3);
    expect(resolvePlaceCount(1)).toBe(2);
    expect(resolvePlaceCount(9)).toBe(5);
    expect(resolvePlaceCount(4)).toBe(4);
  });

  it("한 칸씩 움직이고 끝에서는 그대로", () => {
    expect(stepPlaceCount(3, 1)).toBe(4);
    expect(stepPlaceCount(5, 1)).toBe(5);
    expect(stepPlaceCount(2, -1)).toBe(2);
  });

  it("코스 생성 요청에는 아직 장소 수를 보내지 않는다(요청 계약에 필드 없음)", () => {
    const request = buildSituationRequest({
      time: { start: { meridiem: "오후", hour: 1, minute: 0 }, end: { meridiem: "오후", hour: 5, minute: 0 } },
      placeCount: 4,
      region: { districtId: "11680", label: "강남구" },
      purpose: "date",
    });
    expect(request).not.toHaveProperty("placeCount");
  });

  it("흐름 스냅샷에 장소 수를 저장 · 복원하고, 예전 스냅샷(장소 수 없음)도 그대로 읽는다", () => {
    const base = { step: "region", candidates: [], selectedPlaces: [], createdAt: 1 };
    const time = { start: { meridiem: "오후", hour: 1, minute: 0 }, end: { meridiem: "오후", hour: 5, minute: 0 } };
    expect(parseCourseFlowSnapshot({ ...base, answers: { time, placeCount: 4 } })?.answers.placeCount).toBe(4);
    const legacy = parseCourseFlowSnapshot({ ...base, answers: { time } });
    expect(legacy).not.toBeNull();
    expect(legacy?.answers.placeCount).toBeUndefined();
  });
});
