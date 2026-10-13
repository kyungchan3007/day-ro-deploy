# 상황입력 지역 단계 행정동 미선택 진행 차단

## Task Meta
- task_id: 2026-10-12-region-step-validation
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: done
- task_type: 버그 수정 (QA 시트 #3)
- linked_prd: - (소규모 버그 수정, issue Dayro-dev/dayro#168)
- linked_sdd: - (구조 변경 없음, features/situation 내부)
- branch: `fix/#168-region-step-validation`

## 문제
- 3단계(목적) → 뒤로 → 2단계에서 다른 구 선택 → 행정동 미선택인데 다음 진행 가능
- 원인: `useRegionStep` 이 구 전환 시 선택을 유지(의도된 주석) + `isValid = selected != null`
- 결과: 화면에 안 보이는 이전 동으로 3단계 진입

## 결정
- 구 전환 시 선택한 동이 새 구에 속하지 않으면 선택 해제 (`선택 안 함` 포함)
- 유효성: 선택한 동이 현재 구에 속할 때만 유효 (방어)
- 판단 로직은 순수 함수로 분리 (`model/region-selection.ts`) → 단위 테스트
- 동네 검색 · 인기 키워드 · 뒤로가기 복원 동작은 유지

## 보완 (2026-10-12 사용자 스모크 테스트 피드백)
- 1차 수정은 구 전환 시 선택 해제만 반영 → 아래 누락
  - 뒤로 오면 동네 검색어가 비어 입력값이 사라진 것처럼 보임 (선택은 숨은 채 유지)
  - 동네 검색어를 지워도 선택 유지 → 다음 진행 가능
  - 구 전환 시 동네 검색어는 남음
- 기준 (사용자 확인)
  - 뒤로 와도 구 · 동네 입력값 유지 (검색어 = 선택한 동 이름으로 복원, 결과에 선택 표시)
  - 동네 검색어 삭제 · 구 변경 · `선택 안 함` → 동네(검색어 · 선택) 초기화, 다음 진행 불가

## Acceptance Criteria
- must: 3단계 → 뒤로 → 다른 구 선택 → 다음 버튼 비활성
- must: 같은 구로 복원된 상태에서는 다음 버튼 활성 (기존 동작 유지)
- must: 구 전환 후 새 동 선택하면 다음 버튼 활성
- must: 뒤로 오면 구 · 동네 검색어 · 선택 표시 유지
- must: 동네 검색어 삭제 시 다음 버튼 비활성 · 구 전환 시 검색어 초기화

## Evidence Result
- unit: `region-selection.test.ts` 8건 (유효성 4 · 구 전환 4) · situation 85건 통과
- tsc 통과 · lint 0 errors (기존 경고 1건 `useWheelColumn.ts` 무관)
- e2e (사용자 지시 2026-10-12): `course-region-step.spec.ts` 3건 신규
  - 뒤로 → 같은 구 유지 → 다음 활성 → 3단계 진입 (기존 동작)
  - 뒤로 → 성동구 전환 → 다음 비활성 → 성수 검색·선택 → 활성
  - 뒤로 → `선택 안 함` 전환 → 다음 비활성
  - 수정 전 코드에서 구 전환 2건 실패 확인 (같은 구 1건은 기존 동작이라 통과)
  - 회귀: `course-new` 2건 · `course-min-one-place` 2건 통과 (총 7/7)
  - 참고: 검색어가 비면 인기 검색어가 보여 동 목록은 검색해야 노출
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
- 보완 후 (사용자 지시 e2e 재실행)
  - unit `region-selection.test.ts` 13건 · situation 90건 통과 · tsc · lint 0 errors
  - e2e `course-region-step.spec.ts` 4건 (복원 유지 · 구 전환 · 선택 안 함 · 동네 삭제) + 회귀 4건 → 8/8 통과
  - 1차 수정 코드에서 복원 유지 · 동네 삭제 2건 실패 확인
