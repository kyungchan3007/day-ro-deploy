"use client";

import { useCallback, useMemo, useState } from "react";

import type { PlaceCandidate } from "../../../shared/api/openapi/dayro.openapi";
import {
  MAX_SELECTABLE_PLACES,
  MIN_REQUIRED_PLACES,
  isSelectionFull,
  isSelectionValid,
  selectionHint,
  selectionOrderOf,
  toggleSelection,
} from "../model/course-selection";

/**
 * 코스(장소) 선택 상태 훅 (features/situation).
 *
 * 순수 규칙(model/course-selection)을 감싸 React 상태로 노출한다.
 * 결과 화면(위젯)은 이 훅만 쓰고 순서 계산/최대·최소 판정은 여기서 처리한다.
 *
 * @returns
 *  - selected      : 선택된 후보(선택 순서대로)
 *  - toggle        : 카드 탭 시 선택/해제
 *  - reset         : 선택 초기화(재생성 시 사용)
 *  - orderOf       : placeId → 선택 순번(1-based) | undefined
 *  - isValid       : CTA 활성화 여부(최소 개수 충족)
 *  - isFull        : 최대 개수 도달 여부
 *  - hint          : 선택 상태 안내 문구
 *  - max/min       : 규칙 상수(뷰에서 슬롯 개수 등에 사용)
 */
export function useCourseSelection() {
  const [selected, setSelected] = useState<PlaceCandidate[]>([]);

  const toggle = useCallback((place: PlaceCandidate) => {
    setSelected((prev) => toggleSelection(prev, place, MAX_SELECTABLE_PLACES));
  }, []);

  const reset = useCallback(() => setSelected([]), []);

  const orderOf = useCallback(
    (placeId: string) => selectionOrderOf(selected, placeId),
    [selected],
  );

  const isValid = useMemo(() => isSelectionValid(selected.length), [selected]);
  const isFull = useMemo(
    () => isSelectionFull(selected.length, MAX_SELECTABLE_PLACES),
    [selected],
  );
  const hint = useMemo(() => selectionHint(selected.length), [selected]);

  return {
    selected,
    toggle,
    reset,
    orderOf,
    isValid,
    isFull,
    hint,
    max: MAX_SELECTABLE_PLACES,
    min: MIN_REQUIRED_PLACES,
  };
}
