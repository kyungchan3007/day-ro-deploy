# 상황입력 지역 단계 동네 선택 검색형 드롭다운 SDD

## Meta
- sdd_id: 2026-10-14-region-combobox
- date: 2026-10-14
- owner: Claude(UI 구현, 사용자 지시)
- status: approved(design)
- issue: Dayro-dev/dayro#208

## 현재 구조
- `features/situation/hooks/useRegionStep`: 구 · 검색어 · 선택 상태, 결과 행 계산
  - 빈 검색어면 결과 없음 → 인기 검색어 칩 표시
- `features/situation/ui/RegionAreaSearch`: 공용 `SearchField` + 인기 검색어 칩 / 결과 radiogroup / 빈 안내
- `features/situation/model/region-selection`: #168 선택 유지 규칙

## Design Decisions
- 모델 (`model/region-dropdown.ts` 신규, 순수 함수)
  - `getRegionFilterQuery(query, selected)`: 검색어가 선택한 동 이름 그대로면 필터 없음 → 다시 열면 전체 목록
  - `listRegionAreas(areas, query)`: 빈 검색어 → 구 동네 전체, 아니면 기존 필터
  - `splitRegionHighlight(label, query)`: 일치 글자 강조용 조각
- 선택 유지 규칙 변경 (`keepRegionSelectionForQuery`)
  - 이전: 검색어를 지우면 해제
  - 변경: 검색어가 선택한 동 이름과 달라지면 해제 (지우기 포함)
  - 이유: 콤보박스에서 칸 글자 = 선택 표시 → 글자를 고쳤는데 이전 선택으로 진행되면 안 됨
- 훅 `useRegionStep`
  - 동 선택 · 인기 검색어 선택 시 검색어를 동 이름으로 채움
  - 결과 계산에 `getRegionFilterQuery` 사용, 구-스코프 빈 검색어는 전체 목록
  - `resultsState`: list(구 목록) · search(검색 결과) · hint(구 미선택 빈 검색어) · empty(결과 없음)
  - 인기 검색어 항상 노출 (`showPopularKeywords` 제거)
- 훅 `useRegionDropdown` 신규 (features/situation/hooks)
  - 열림 상태, 바깥 pointerdown 닫기, Esc 닫기, ▾ · 칸 클릭 토글
  - 입력하면 열림, 선택하면 닫힘
  - UI 파일 useEffect 금지 규칙(client-logic-separation) 준수
- UI `RegionAreaSearch`
  - 칸: 검색 아이콘 + 입력(searchbox, aria-expanded · aria-controls) + 지우기 + ▾
  - 패널: 칸 바로 아래 in-flow (본문 스크롤 하나 원칙 유지, 하단 CTA 에 가려지지 않음)
    - 인기 검색어 칩 → 구분선 → 캡션 → radiogroup "동네 선택" / 안내 / 빈 결과
  - 접근성 이름 유지: searchbox "동네 검색", radiogroup "동네 선택" → 기존 e2e 선택자 호환
- 공용 `SearchField`: 입력 이벤트 · aria 전달용 `inputProps`, 오른쪽 `trailing` 슬롯 추가 (선택 prop, 기존 사용처 영향 없음)

## 레이어
- 상태 · 판단: features/situation (model · hooks)
- 조각 UI: features/situation/ui
- 조합: widgets/situation/SituationRegionScreen (props 변경만)
- 공용 primitive 확장: shared/ui/field

## 테스트
- unit: region-dropdown 모델 · 변경된 선택 유지 규칙
- e2e: 드롭다운 열기 · 구 목록 · 인기 검색어 항상 · 선택 없이 접기 4가지 · 구 자동 변경
