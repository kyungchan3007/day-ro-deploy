# 다른 코스 보기 API 연결 검증 리포트

## 작업 일시 (실행 날짜)
- 2026-08-18

## Intent Source (의도 출처)
- task_id: `2026-08-18-course-reroll-api-validation`
- intent artifact: `.agents/intent/tasks/2026-08-18-course-reroll-api-validation.md`

## 검증 대상 (대상 파일 / 범위)
- 프런트 `src/widgets/situation/hooks/useSituationFlowController.ts`
- 프런트 `src/features/situation/server/get-course-new-page-data.ts`
- 프런트 `src/shared/api/server-situation-backend-client.ts`
- 프런트 `src/shared/api/openapi/dayro.openapi.ts`
- 백엔드 `../backend/dayro-backend/src/main/java/com/dayro/situation/controller/SituationController.java`
- 백엔드 `../backend/dayro-backend/src/main/java/com/dayro/situation/dto/response/CourseCandidateResponse.java`

## 최종 결정 (판정 결과)
- `rejected`

## Acceptance Criteria 확인 (완료 조건 점검)
- 프런트 `다른 코스 보기` 호출 경로 확인: 충족
- 백엔드 전용 retry endpoint 존재 여부 확인: 충족
- 프런트/백엔드 계약 불일치 식별: 충족
- 소스 코드 무수정 검증: 충족

## 변경 파일 요약 (수정 범위)
- `.agents/intent/tasks/2026-08-18-course-reroll-api-validation.md`
- `.agents/reports/validation/2026-08-18-course-reroll-api-validation.md`

## 실행 루프 요약 (작업 흐름 요약)
- loop type: `Quick Loop`
- iterations: `1`
- handoff 사용 여부: `no`

## 실행한 검증 명령 (검증 커맨드)
- `rg -n "다른 코스|다른코스|other course|other-course|view other|other courses" src .agents/intent .agents/reports`
- `rg -n "course.*api|api.*course|/api/courses|/courses|추천|재추천|selection|confirm|deeplink" .agents/intent/tasks .agents/intent/sdd .agents/reports/validation src/features src/app src/shared`
- `rg -n "reroll|refresh|다른 코스 보기|other course|other-course|recommand|recommend|situations" .`
- `git log --since='2026-08-01' --oneline -- .`

## Evidence Gate (증거 통과 여부)
- intent artifact: `pass`
- tests: `not_run` - 구조/계약 확인 요청이었고 실제 수정이 없었다.
- typecheck: `not_run` - 소스 수정이 없었다.
- build: `not_run` - 소스 수정이 없었다.
- additional review: `pass`

## 구조 / VSA 검토 결과 (아키텍처 판단)
- 프런트 결과 화면의 `handleReroll`은 `refresh` 쿼리만 바꿔 같은 result route로 다시 push 한다.
- 서버 page 데이터 준비는 result/course 단계 모두 `submitSituation(...)`를 다시 호출해 후보를 재구성한다.
- 프런트 transport 와 OpenAPI 계약은 여전히 `POST /api/situations` 단일 endpoint만 알고 있다.
- 백엔드는 2026-08-11 기준 `POST /api/situations/{requestId}/retry` endpoint 와 `requestId`, `remainingRetries` 응답 계약을 추가했다.
- 따라서 현재 프런트는 백엔드의 전용 retry 계약을 사용하지 못하고 있으며, 남은 재시도 횟수와 제한 초과 에러를 소비할 수 없다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `doc_mismatch`: 프런트 계약이 최신 백엔드 retry API를 반영하지 못함
- `missing_evidence`: 실제 통합 서버 호출 실행은 하지 않았음

## 남은 리스크 및 후속 작업 (후속 조치)
- 프런트 BFF/OpenAPI에 `POST /api/situations/:requestId/retry` 계약을 추가해야 한다.
- 결과 화면은 최초 추천 응답의 `requestId`, `remainingRetries`를 유지하고 reroll 시 retry endpoint를 호출해야 한다.
- 현재 FAQ의 "하루 최대 5회" 문구는 백엔드와 맞을 가능성이 높지만, UI에는 남은 횟수 노출이 없어 정책 연결이 끊겨 있다.
