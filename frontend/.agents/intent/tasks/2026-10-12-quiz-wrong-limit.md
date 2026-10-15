# 로딩 초성퀴즈 오답 재입력 2회 제한 · 정답 자동 공개

## Task Meta
- task_id: 2026-10-12-quiz-wrong-limit
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: done
- task_type: 버그 수정 (QA 시트 #17)
- linked_prd: - (소규모 정책 반영, issue Dayro-dev/dayro#175)
- linked_sdd: - (구조 변경 없음, features/loading-quiz 내부)
- branch: `fix/#175-quiz-wrong-limit`

## 문제
- 오답을 몇 번 제출해도 "오답입니다"만 반복 · 정답 공개 · 다음 문제 전환 없음
- 원인: 오답 횟수 · 공개 상태 없음, "다음 문제"는 정답일 때만 노출

## 결정 (사용자 확인: QA 문구 "오답 최대 2회까지만 재입력 허용, 이후 정답 자동 노출 · 다음 문제 전환")
- 첫 오답 후 다시 입력 2회까지 허용 → 3번째 오답이면 정답 공개
- 공개 시 "정답은 'OOO'이에요" 표시 · 입력 · 제출 잠금 → 2초 뒤 자동으로 다음 문제
- 다음 문제로 넘어가면 오답 횟수 초기화 (건너뛰기 · 정답 흐름 유지)
- 횟수 · 공개 판단은 순수 함수(`model/attempt-policy.ts`) → 단위 테스트
- 피드백 상태에 `revealed` 추가

## Acceptance Criteria
- must: 오답 2회까지는 계속 입력 가능
- must: 3번째 오답 → 정답 공개 · 입력 잠금 → 자동 다음 문제(입력 비움 · 잠금 해제)
- must: 기존 정답 · 다음 문제 · 건너뛰기 동작 유지

## Evidence Result
- unit: `attempt-policy.test.ts` 6건 신규 · 전체 829건 통과
- tsc 통과 · lint 0 errors
- e2e (사용자 지시 2026-10-12): `course-loading-quiz.spec.ts` 2건 추가 + 회귀 5건 → 7/7 통과
  - 오답 2회까지 정답 미공개 · 입력 가능
  - 3번째 오답 → 정답 공개 · 입력 잠금 → 자동 다음 문제 · 오답 횟수 초기화
  - 회귀: 기존 퀴즈 2건 · course-new 2건 · course-retry-failure 1건
  - 수정 전 코드에서 정답 공개 시나리오 실패 확인 (오답 2회 시나리오는 예전에도 무제한이라 통과)
  - 녹화 영상 2개 → 노션 QA #17
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
