# Harness Observability

이 문서는 에이전트 작업의 실행 흔적을 어떤 필드로 남길지 정의한다.

## 목적
- 작업 결과뿐 아니라 실패와 재시도 경로를 관측한다.
- 어떤 gate에서 자주 막히는지 분류 가능하게 만든다.
- 향후 automation 또는 orchestration이 사용할 telemetry 계약을 만든다.
- eval과 validation이 어떤 evidence 부족으로 흔들렸는지 누적해서 볼 수 있게 만든다.

## 관측 계층
Observability는 아래 3개 층으로 운영한다.

1. `Per-Task`
   - 개별 task의 run log
2. `Per-Decision`
   - validation report의 decision, failure taxonomy, 미검증 항목
3. `Accumulation`
   - 여러 task를 모아 반복 패턴을 보는 summary artifact

관측 대상은 loop 뿐 아니라 tool/environment 한계, eval 누락, guardrail 위반까지 포함한다.

## Run Log 필수 필드
실행 로그는 아래 필드를 기본값으로 가진다.

- `task_id`
- `date`
- `task_type`
- `owners`
- `intent_source`
- `documents_loaded`
- `loop_type`
- `current_stage`
- `iterations`
- `evidence_commands`
- `evidence_bundle`
- `decision`
- `failure_stage`
- `failure_reason`
- `followup_action`
- `guardrail_flags`

## 단계 기록 규칙
- `current_stage`는 마지막으로 완료했거나 현재 머문 단계를 적는다.
- `stages_visited`는 루프 순서대로 기록한다.
- `iterations`는 동일 task_id에서 implement 이후 재시도 횟수를 기준으로 적는다.
- `evidence_commands`는 실제 실행했거나 명시적으로 생략 사유가 있는 명령만 적는다.
- `evidence_bundle`은 어떤 기본 증거 묶음을 기준으로 판단했는지 적는다.
- `decision`은 validation decision과 동일한 vocabulary를 사용한다.

## 실패 분류
실패 또는 reject는 아래 taxonomy 중 하나 이상으로 기록한다.

- `intent_gap`
- `boundary_conflict`
- `implementation_bug`
- `test_failure`
- `type_error`
- `build_failure`
- `performance_risk`
- `doc_mismatch`
- `missing_evidence`
- `external_blocker`

## 분류 규칙
- `intent_gap`
  - acceptance criteria가 비어 있거나 범위가 흔들린 경우
- `boundary_conflict`
  - SSR/BFF/client, client-safe/server-only 경계가 닫히지 않은 경우
- `implementation_bug`
  - 구조는 맞지만 구현이 동작 요구를 만족하지 못하는 경우
- `test_failure`
  - 테스트 명령 실패 또는 기대 동작 불일치가 발생한 경우
- `type_error`
  - typecheck가 실패한 경우
- `build_failure`
  - build가 실패한 경우
- `performance_risk`
  - 성능 trigger가 있고 미해결 위험이 남은 경우
- `doc_mismatch`
  - domain/guide/intent와 실제 변경이 어긋난 경우
- `missing_evidence`
  - 필요한 검증 명령 또는 구조 검토 근거가 없는 경우
- `external_blocker`
  - 사용자 입력 또는 외부 상태 변화 없이는 진행할 수 없는 경우

## Guardrail 기록
- `guardrail_flags`에는 아래와 같은 값을 기록할 수 있다.
  - `approval_required`
  - `boundary_confirmation_required`
  - `network_restricted`
  - `build_skipped_with_reason`
  - `validation_not_independent`

## 최소 기록 원칙
- 모든 작업에서 별도 run log 파일이 필수는 아니다.
- 아래 중 하나라도 해당하면 `.agents/reports/runs/`에 남긴다.
  - validation이 `approved_with_notes`, `rejected`, `blocked`
  - 루프가 2회 이상 반복
  - 사용자 확인이 필요했던 경계 충돌
  - 테스트/빌드/성능 경고가 후속 작업으로 남음

## 권장 기록 원칙
- `approved`라도 Full Loop 작업이면 run log를 남기는 것을 권장한다.
- 같은 task_id에서 handoff가 있었으면 run log와 handoff log를 함께 남기는 것을 권장한다.

## 누적 운영 규칙
- run log 5건 이상이 쌓이면 summary artifact를 작성하는 것을 권장한다.
- 동일 failure_reason이 2회 이상 반복되면 summary에 recurring pattern으로 기록한다.
- `approved_with_notes`가 반복되면 notes 원인을 묶어 개선 후보로 정리한다.
- `missing_evidence`, `boundary_conflict`, `doc_mismatch`는 하네스 품질 이슈로 분리해서 본다.

## Summary Artifact
- 위치:
  - `.agents/reports/observability/`
- 용도:
  - 기간별 run log 요약
  - recurring failure pattern
  - loop type 분포
  - decision 분포
  - follow-up backlog

## Summary 필수 항목
- 대상 기간
- 포함 task 수
- loop type 분포
- decision 분포
- failure_reason 분포
- recurring pattern
- top follow-up actions
- harness 개선 후보

## 활용
- ValidationAgent는 최종 리포트에 failure taxonomy를 함께 적는다.
- Orchestration 문서는 run log를 handoff 근거로 사용한다.
- summary artifact는 harness 개선과 orchestration 규칙 보정의 근거로 사용한다.
