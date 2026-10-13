# 코스 결과 최소 선택 4곳 → 1곳

## Task Meta
- task_id: 2026-10-10-min-one-place
- date: 2026-10-10
- owner: Claude(구현, 사용자 지시)
- status: done
- task_type: 기능 수정 (UX 상수 변경)
- linked_prd: - (소규모 상수 변경, issue Dayro-dev/dayro#163)
- linked_sdd: - (구조 변경 없음)
- branch: `feat/#163-min-one-place`

## 결정
- `MIN_REQUIRED_PLACES` 4 → 1 (`features/course-result/model/course-selection.ts`)
- 안내 문구는 상수 기반이라 자동으로 `최소 1곳을 선택해야해요`
- 유지(사용자 결정): 경로 안내 · 저장 코스 공유는 좌표 2곳 이상일 때만 (`MIN_ROUTE_POINTS = 2`), 1곳이면 기존 "장소가 부족해요" 안내
- 최대 5곳 유지 · 백엔드 저장 API `@NotEmpty` 로 1곳 저장 가능

## Acceptance Criteria
- must: 1곳 선택 시 선택 완료 버튼 활성 → 지도 화면 진행
- must: 0곳이면 비활성 · 안내 문구 표시
- must: 최대 5곳 · 경로 안내 2곳 이상 규칙 변경 없음

## Evidence Result
- unit: `course-selection.test.ts` 기준 갱신 (0곳 비활성 · 1/3/5곳 활성 · 안내 문구)
- e2e 메시지 문구만 정리 (`course-new.spec.ts`, 4곳 선택 시나리오 자체는 유지)
- 전체 unit 775 통과 · lint 0 errors · tsc · build 통과 · 번들 예산 `/course/new` 619,769B
- e2e (사용자 지시 2026-10-10): `course-min-one-place.spec.ts` 2건 신규
  - 후보 3곳(응답 가로채 축소) → 0곳 비활성·안내 문구 → 3곳 선택 → 지도 화면
  - 1곳 선택 → 지도 화면 → 경로 안내 시 "장소가 부족해요" 안내 · 새 탭 없음
  - 수정 전 코드(최소 4곳)에서 2건 모두 실패 확인
  - 회귀: `course-new.spec.ts` 2건 · `course-map-route-guide.spec.ts` 1건 통과 (총 5/5)
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
