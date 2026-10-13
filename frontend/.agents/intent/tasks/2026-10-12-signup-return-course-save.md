# 코스 저장 중 로그인·회원가입 후 저장 화면 복귀

## Task Meta
- task_id: 2026-10-12-signup-return-course-save
- date: 2026-10-12
- owner: Claude(구현, 사용자 지시)
- status: done
- task_type: 버그 수정 (QA 시트 #11)
- linked_prd: `prd/2026-10-12-signup-return-course-save.md`
- linked_sdd: `sdd/2026-10-12-signup-return-course-save.md`
- branch: `fix/#169-signup-return-course-save`

## Tasks
- [x] situation: 흐름 스냅샷 인계 보관 · 복원 (`course-flow-handoff`)
- [x] course-map: 대기 저장 보관 · 읽기 · 삭제 (`pending-course-save`)
- [x] `useCourseMapScreen`: 401 시 보관 후 로그인 이동 · 진입 시 저장 재개 · 토스트
- [x] 단위 테스트 (인계 병합 · TTL · 손상 · 재개 결과별 토스트)
- [x] e2e (새 탭 복귀 · 같은 탭 복귀)

## Acceptance Criteria
- must: 새 탭으로 복귀해도 코스 화면 복원 + 저장 완료 토스트
- must: 같은 탭 복귀도 저장 재개 + 토스트
- must: 만료 · 손상 데이터는 무시, 한 번 재개하면 삭제

## Evidence Result
- unit: `course-flow-handoff.test.ts` 9건 · `pending-course-save.test.ts` 13건 신규, 전체 823건 통과
- tsc 통과 · lint 0 errors (기존 경고 1건 `useWheelColumn.ts` 무관)
- e2e (사용자 지시 2026-10-12): `course-save-login-return.spec.ts` 3건 + 회귀 10건 → 13/13 통과
  - 새 탭 복귀(sessionStorage 없음) → 코스 화면 복원 · 저장 완료 토스트 · 새로고침 시 재저장 없음
  - 같은 탭 복귀 → 저장 완료 토스트
  - 돌아와도 401 → "로그인 후 다시 저장해주세요." · 로그인으로 다시 안 보냄
  - 회귀: course-new · course-min-one-place · course-map-route-guide · login-next · saved
  - 수정 전 코드에서 신규 3건 모두 실패 확인
  - 비로그인/로그인은 저장 BFF 응답(401 · 200)을 가로채 재현 (실제 카카오 화면 없음)
  - 녹화 영상 5개 → 노션 QA #11 (느린 속도 녹화, 저장소 밖 임시 설정)
  - 환경: 별도 worktree, e2e 포트 3120 · 목 백엔드 18091
