"use client";

import { useState } from "react";

import {
  isSameCourseOrder,
  reorderCoursePlaces,
  toCoursePreviewPoints,
  type CoursePlaceItem,
  type CoursePoint,
} from "./course-preview";

export interface UseCoursePreviewOrderValue<T extends CoursePlaceItem> {
  /** 현재(사용자가 바꾼) 순서. */
  places: T[];
  /** 현재 순서에서 파생된 지도 포인트(마커 번호·경로선). */
  points: CoursePoint[];
  isEmpty: boolean;
  /** 기준 순서에서 바뀐 상태인지(되돌리기·수정완료 노출 판단). */
  isReordered: boolean;
  /** 드래그앤드롭 재정렬: from → to 로 이동. */
  reorder: (from: number, to: number) => void;
  /** 기준 순서로 되돌리기. */
  resetOrder: () => void;
  /** 현재 순서를 새 기준 순서로 확정(저장 성공 후). */
  commitOrder: () => void;
}

/**
 * 코스 장소 순서 변경 훅 (shared/lib, 확정 코스·저장 코스 상세 공용).
 *
 * 기준 순서(baseline)와 현재 순서를 클라이언트 state 로 들고, 재정렬·되돌리기·확정을 제공한다.
 * 지도 포인트는 현재 순서에서 파생되므로 재정렬 시 자동 갱신된다.
 *
 * @param initialPlaces 최초 기준 순서. 마운트 시점 값만 사용한다.
 *   다른 코스로 바뀌면 호출부가 화면을 다시 마운트해야 한다(현재 상황입력 흐름은 단계 전환 시 항상 언마운트).
 */
export function useCoursePreviewOrder<T extends CoursePlaceItem>(
  initialPlaces: readonly T[],
): UseCoursePreviewOrderValue<T> {
  const [baseline, setBaseline] = useState<T[]>(() => [...initialPlaces]);
  const [places, setPlaces] = useState<T[]>(() => [...initialPlaces]);

  return {
    places,
    points: toCoursePreviewPoints(places),
    isEmpty: places.length === 0,
    isReordered: !isSameCourseOrder(places, baseline),
    reorder: (from, to) => setPlaces((prev) => reorderCoursePlaces(prev, from, to)),
    resetOrder: () => setPlaces([...baseline]),
    commitOrder: () => setBaseline([...places]),
  };
}
