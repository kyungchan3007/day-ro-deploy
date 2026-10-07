# 찜한 코스 삭제 E2E 검증 리포트

## 작업 일시 (실행 날짜)
- 2026-09-03 (Asia/Seoul)

## Intent Source (의도 출처)
- task_id: `2026-09-03-saved-course-delete-e2e`
- intent artifact: 사용자 요청의 inline Execution Spec
- acceptance criteria:
  - `/saved` 카드의 접근 가능한 삭제 버튼으로 확인 다이얼로그를 연다.
  - 취소하면 대상 코스가 목록에 남는다.
  - 삭제를 확인하면 대상 코스가 목록에서 제거된다.
  - 기존 saved 목록/상세/빈 상태/비로그인 회귀를 확인한다.
  - 앱 로직/UI를 수정하거나 커밋하지 않는다.

## 검증 대상 (대상 파일 / 범위)
- `src/e2e/saved/saved.spec.ts`
- `src/e2e/saved/saved-empty.spec.ts`
- `src/e2e/support/mock-backend-server.mjs`의 기존 DELETE/reset mock
- 전체 Playwright E2E 스위트

## 최종 결정 (판정 결과)
- `approved_with_notes`
- 표준 전체 스위트에서 15개 시나리오가 모두 통과했고, saved 관련 4개 시나리오도 모두 통과했다.

## Acceptance Criteria 확인 (완료 조건 점검)
- 통과: `서촌 데이트 코스 삭제` 버튼 클릭 후 이름이 `이 코스를 삭제할까요?`인 `dialog`가 표시된다.
- 통과: `취소` 클릭 후 dialog가 닫히고 코스 링크가 유지된다.
- 통과: dialog를 다시 열어 `삭제`를 확인하면 대상 코스 링크와 삭제 버튼이 제거된다.
- 통과: 삭제하지 않은 `성수 산책 코스`는 유지된다.
- 통과: 비로그인 redirect, 목록/상세, 빈 상태 CTA 회귀가 유지된다.

## 변경 파일 요약 (수정 범위)
- `src/e2e/saved/saved.spec.ts`
  - 취소와 삭제 확인을 함께 검증하는 E2E 시나리오 1개 추가.
  - 상태형 mock과 기존 상세 테스트의 간섭을 막기 위해 파일을 serial로 설정하고 각 테스트 전에 mock reset 수행.
- 앱 로직/UI 및 E2E 지원 파일 변경 없음.
- 커밋 없음.

## 실행 루프 요약 (작업 흐름 요약)
- loop type: `Quick Loop`
- iterations: 구현 1회, evidence 실행 재시도 2회
- handoff 사용 여부: 없음
- evidence bundle: `UI Bundle`, `Validation Bundle`

## 실행한 검증 명령 (검증 커맨드)
- `npm run test:e2e -- src/e2e/saved`
  - 1차/2차: webServer 시작 전 `listen EPERM 127.0.0.1:18080`으로 종료.
- `npm run test:e2e`
  - 통과: 15 passed, 0 failed (15.9s).
  - saved: 4 passed, 0 failed.
  - 새 삭제 시나리오: 1 passed, 0 failed.
- `npx eslint src/e2e/saved/saved.spec.ts`
  - 통과.
- `git diff --check`
  - 통과.

## Evidence Gate (증거 통과 여부)
- intent artifact: 통과 — 사용자 inline Execution Spec과 검증 가능한 acceptance criteria 사용.
- tests: 통과 — 전체 E2E 15/15, saved 4/4, 삭제 1/1.
- typecheck: `not_run` — TypeScript 기반 Playwright 전체 스위트가 스펙을 로드·실행했고 변경 범위가 E2E 스펙 1개뿐이라 별도 실행하지 않음.
- build: `not_run` — 앱 로직/UI 변경이 없고 Playwright webServer가 실제 Next 앱을 기동해 전체 플로우를 검증함.
- additional review: 통과 — targeted ESLint, diff check, role/name 기반 selector 정적 검토.
- skipped with reason: 없음.

## 구조 / VSA 검토 결과 (아키텍처 판단)
- E2E는 기존 `src/e2e/saved/` 슬라이스에 배치했다.
- 앱 계층이나 공용 UI API를 변경하지 않았다.
- 기존 mock backend의 DELETE 및 reset 계약을 재사용했다.
- 공용 UI 재사용 여부: 해당 없음. 테스트 코드만 변경했고, 실제 화면은 기존 `ConfirmDialog`를 사용한다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `external_blocker`(일시적): saved 전용 실행 2회에서 샌드박스 로컬 포트 바인딩이 `EPERM`으로 거부됐다. 브라우저 미설치, 네트워크 차단, assertion 실패 또는 코드 문제는 아니다.
- 전체 표준 명령은 동일 환경에서 정상 기동되어 모든 시나리오가 통과했으므로 최종 기능 판정을 막지 않는다.
- `doc_mismatch`: `.agents/domain/saved.md`는 삭제를 Out Of Scope로 기록해 현재 구현과 불일치한다. 사용자 제약상 이번 작업에서는 문서를 수정하지 않았다.

## 남은 리스크 및 후속 작업 (후속 조치)
- 샌드박스의 간헐적 로컬 포트 `EPERM`은 focused E2E 명령 재현성을 낮출 수 있다.
- 후속 문서 작업에서 Saved 도메인의 삭제 action/state/transition/test point와 Out Of Scope를 현재 구현에 맞게 갱신할 필요가 있다.
