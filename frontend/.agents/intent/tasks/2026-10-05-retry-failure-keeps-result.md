# 재추천 실패 시 결과 유지

## Task Meta
- task_id: 2026-10-05-retry-failure-keeps-result
- date: 2026-10-05
- owner: Claude(구현)
- status: done
- task_type: 버그 수정
- linked_prd: - (버그 수정, issue Dayro-dev/dayro#143, 로컬 스모크 테스트 발견)
- linked_sdd: `intent/sdd/2026-10-05-retry-failure-keeps-result.md`
- branch: `bug/#143-retry-failure-keeps-result`

## Acceptance Criteria
- must: 재추천 실패·중단 시 같은 결과 화면(requestId·후보)으로 돌아가고 남은 횟수 유지
- must: 재추천 실패 안내 문구 표시
- must: 최초 생성 실패는 기존대로 목적 단계
- must: 장애 해소 후 재추천이 같은 세션으로 이어지고 남은 횟수 1 감소

## Evidence Result
- unit: `useCourseFlowRedirects.test.ts` 5건(재추천 실패·중단 → result, 최초 생성 → purpose, 후보 없는 스냅샷 → purpose, 대기 중 무동작), `retry-analytics.test.ts` 후보 기록 단언
- e2e: `course-retry-failure.spec.ts` — BFF 503 가로채기 → 결과·첫 후보·남은 횟수 유지 + 안내, 해제 후 재추천 → 남은 횟수 1 감소. 수정 전 코드에서 실패 확인
- lint 0 errors · tsc · build · 번들 예산(`/course/new` 619,769B) · e2e 19/19
- 전체 unit: 756 통과, `contact-form` 1건은 #142(머지 대기)에서 해소된 기존 불안정 테스트
- 작업 환경: 사용자 스모크 서버(3000)와 분리된 worktree, e2e 포트 3110·목 백엔드 18090
