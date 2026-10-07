# Agent Reports

이 디렉터리는 에이전트 작업 결과 리포트를 저장한다.

## Legacy Policy
`2026-08-08` 이전에 작성된 `.agents/reports/validation/*.md`는 `legacy validation report`로 본다.

- legacy report는 당시 작업의 validation evidence로는 사용 가능하다.
- legacy report는 `intent artifact`, `run log`, `handoff log`를 대체하지 않는다.
- legacy report를 새 스키마에 맞춰 소급 수정하는 것은 기본 작업이 아니다.
- 새 작업은 현재 문서가 정의한 보고 체계를 따른다.

## Run Logs
실행 루프 관측 로그는 `.agents/reports/runs/`에 저장한다.

- loop iteration 수
- 어떤 gate에서 막혔는지
- reject 또는 retry 원인
- 다음 액션

## Observability Summaries
여러 run log를 누적한 요약은 `.agents/reports/observability/`에 저장한다.

- 기간별 task 분포
- decision 분포
- failure_reason 분포
- recurring pattern
- harness 개선 후보

## Handoff Logs
세션 간 또는 역할 간 handoff 기록은 `.agents/reports/handoffs/`에 저장한다.

- 현재 단계
- 남은 acceptance criteria
- 미해결 리스크
- 다음 owner

## Validation Reports
최종 검증 결과는 `.agents/reports/validation/`에 Markdown 파일로 저장한다.

파일명은 다음 형식을 따른다.

```text
YYYY-MM-DD-task-name.md
```

리포트에는 다음 내용을 포함한다.

- 작업 요약
- intent source 또는 acceptance criteria 출처
- 요구사항 충족 여부
- 변경 파일 요약
- 실행 루프 요약
- 테스트 결과
- 린트, 타입체크, 빌드 결과
- evidence gate 통과 여부
- failure taxonomy 또는 미검증 항목
- VSA 준수 여부
- 최종 결정
- 남은 리스크 또는 후속 작업

## Decision Vocabulary
validation report와 run log의 결정값은 아래만 사용한다.

- `approved`
- `approved_with_notes`
- `rejected`
- `blocked`

## Summary Artifact Template

```md
# Observability Summary - <period>

## Period (집계 기간)
- from:
- to:

## Scope (집계 범위)
- task count:
- included run logs:

## Loop Distribution (루프 분포)
- quick_loop:
- full_loop:

## Decision Distribution (판정 분포)
- approved:
- approved_with_notes:
- rejected:
- blocked:

## Failure Distribution (실패 분포)
- intent_gap:
- boundary_conflict:
- implementation_bug:
- test_failure:
- type_error:
- build_failure:
- performance_risk:
- doc_mismatch:
- missing_evidence:
- external_blocker:

## Recurring Patterns (반복 패턴)
- 

## Top Follow-up Actions (주요 후속 작업)
- 

## Harness Improvement Candidates (하네스 개선 후보)
- 
```

## 최소 Evidence 기준
- `Quick Loop`:
  - execution spec
  - self-check 또는 동등한 체크리스트
  - 관련 테스트 또는 구조 리뷰 근거
  - 미실행 evidence가 있으면 사유 기록
- `Full Loop`:
  - execution spec
  - 필요 시 SDD / PRD
  - self-check note
  - 관련 테스트 결과
  - typecheck 결과
  - build 결과 또는 미실행 사유
  - validation report

## Evidence Bundle 기록 규칙
- validation report와 run log는 가능하면 사용한 evidence bundle 이름을 함께 적는다.
- 예:
  - `Doc Bundle`
  - `Quick Code Bundle`
  - `UI Bundle`
  - `BFF Bundle`
  - `Validation Bundle`
- bundle의 일부를 실행하지 않았으면 결과 대신 `not_run`과 사유를 남긴다.

## Validation Report Template
새 validation report는 아래 형식을 기본값으로 사용한다.

```md
# <작업 제목> 검증 리포트

## 작업 일시 (실행 날짜)
- 

## Intent Source (의도 출처)
- task_id:
- intent artifact:

## 검증 대상 (대상 파일 / 범위)
- 

## 최종 결정 (판정 결과)
- `approved | approved_with_notes | rejected | blocked`

## Acceptance Criteria 확인 (완료 조건 점검)
- 

## 변경 파일 요약 (수정 범위)
- 

## 실행 루프 요약 (작업 흐름 요약)
- loop type:
- iterations:
- handoff 사용 여부:
- evidence bundle:

## 실행한 검증 명령 (검증 커맨드)
- 

## Evidence Gate (증거 통과 여부)
- intent artifact:
- tests:
- typecheck:
- build:
- additional review:
- skipped with reason:

## 구조 / VSA 검토 결과 (아키텍처 판단)
- 

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- 

## 남은 리스크 및 후속 작업 (후속 조치)
- 
```

## 압축된 의도를 가리키는 과거 링크 처리
- `reports/runs/*`, `reports/validation/*`의 과거 로그는 압축 전 intent 경로(`intent/sdd|tasks/<날짜>-<slug>.md`)를 그대로 참조할 수 있다.
- 이는 당시 기록이므로 **소급 수정하지 않는다**. 해당 원본은 `.agents/intent/archive/YYYY-MM.md`의 같은 `task_id` 블록 + `git show <ref>:<path>`로 추적한다.
- 새 리포트는 압축된 의도를 참조할 때 archive 블록(`archive/YYYY-MM.md#<task_id>`)을 우선 링크한다.
