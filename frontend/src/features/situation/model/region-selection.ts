import type { SituationRegionValue } from "./types";

/**
 * 지역 스텝 선택 규칙 (QA #3, issue #168).
 *
 * 선택한 동은 현재 보고 있는 구(activeGroup)에 속할 때만 유효하다.
 * 구를 바꿨는데 이전 구의 동이 남아 있으면, 화면에 안 보이는 동으로 다음 단계에 진입하게 된다.
 *
 * 화면 동작 기준(사용자 확인):
 *   - 뒤로 와도 구 · 동네 입력값은 그대로 남는다(동네 검색어 = 선택한 동 이름으로 복원).
 *   - 동네 검색어를 지우거나, 구를 바꾸거나 `선택 안 함`으로 바꾸면 동네가 초기화되고 다음 단계로 갈 수 없다.
 *   - 동네 칸이 검색형 드롭다운이 된 뒤(QA #2, issue #208): 칸 글자 = 고른 동 이름이므로,
 *     글자를 고쳐 동 이름과 달라지면(지우기 포함) 동네가 초기화된다.
 */

/** 구 전환 후에도 유지할 선택. 새 구에 속하지 않으면 선택을 해제한다(`선택 안 함` 포함). */
export function keepRegionSelectionInGroup(
  selected: SituationRegionValue | undefined,
  nextGroup: string | undefined,
): SituationRegionValue | undefined {
  return isRegionSelectionValid(selected, nextGroup) ? selected : undefined;
}

/** 다음 단계 진행 가능 여부: 동을 골랐고 그 동이 현재 구에 속한다. */
export function isRegionSelectionValid(
  selected: SituationRegionValue | undefined,
  activeGroup: string | undefined,
): selected is SituationRegionValue {
  return selected != null && selected.categoryId === activeGroup;
}

/** 동네 검색어 변경 후에도 유지할 선택. 검색어가 고른 동 이름과 달라지면(지우기 포함) 선택을 해제한다. */
export function keepRegionSelectionForQuery(
  selected: SituationRegionValue | undefined,
  nextQuery: string,
): SituationRegionValue | undefined {
  return selected && nextQuery.trim() === selected.label ? selected : undefined;
}

/** 뒤로 와서 복원할 때 동네 검색어. 선택한 동 이름을 다시 채워 결과 목록에 선택이 보이게 한다. */
export function restoreRegionQuery(selected: SituationRegionValue | undefined): string {
  return selected?.label ?? "";
}
