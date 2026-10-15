# 순서 바꾸기 손잡이 아이콘 햄버거 바(≡) 통일

## Task Meta
- task_id: 2026-10-12-drag-handle-icon
- date: 2026-10-12
- owner: Claude(UI 구현, 사용자 지시)
- status: done
- task_type: UI 수정 (QA 시트 #15)
- linked_prd: - (소규모 UI, issue Dayro-dev/dayro#185)
- linked_sdd: - (구조 변경 없음)
- branch: `fix/#185-drag-handle-icon`

## 문제 (QA 원문 · 첨부 캡처)
- 목록 안내 문구 "≡ 를 끌어 순서를 바꿔보세요" ↔ 손잡이 점 6개(⠿) `GripVerticalIcon` → 모양 불일치
- 26주차 QA 정리 때 "두 화면 같은 아이콘이라 재현 안 됨"으로 판단했으나, 실제 불일치는 안내 문구 ↔ 손잡이

## 결정
- `CoursePlaceList` 손잡이를 기존 공용 `MenuIcon`(가로 3줄)으로 교체 · 크기 18 · 색 · 접근성 이름(`{장소} 순서 변경`) 유지
- 새 아이콘 그리지 않음 (디자인 결정 없음) · `GripVerticalIcon` export 는 유지(다른 사용처 대비)
- 코스 화면 · 찜한 코스 상세가 같은 컴포넌트라 함께 반영

## Acceptance Criteria
- must: 두 화면 손잡이가 ≡ (점 그립 없음)
- must: 키보드 · 포인터 순서 변경 동작 유지

## Evidence Result
- tsc 통과 · lint 0 errors · unit 847건 통과
- e2e (사용자 지시 2026-10-12): `course/course-drag-handle.spec.ts` 3건 + 회귀 14건 → 17/17 통과
  - 찜한 코스 상세 손잡이 3개 ≡ · 코스 화면 손잡이 ≡ · 키보드 순서 변경 → 수정완료 활성
  - 회귀: saved · course-min-one-place · course-save-sheet-status
  - 수정 전 코드에서 아이콘 2건 실패 확인 (키보드 순서 변경은 기존 동작이라 통과)
  - CI 1회 실패(키보드 시나리오, 키 입력 간 대기 없음) → aria-pressed 대기 · 키 사이 대기로 수정(2adf6d3) · 로컬 병렬 5×5 반복 15/15 통과
  - 녹화 영상 3개 → 노션 QA #15
