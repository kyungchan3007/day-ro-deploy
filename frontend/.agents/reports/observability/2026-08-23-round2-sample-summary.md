# Observability Summary - 2026-08-23 Round 2 Sample

## Period (집계 기간)
- from: 2026-08-07
- to: 2026-08-23

## Scope (집계 범위)
- task count: 5
- included run logs:
  - `.agents/reports/runs/2026-08-07-course-save-api.md`
  - `.agents/reports/runs/2026-08-23-harness-quick-loop-evidence.md`
  - `.agents/reports/runs/2026-08-23-quick-loop-probe-suite.md`
  - `.agents/reports/runs/2026-08-23-context-observability-round2.md`
  - `.agents/reports/runs/2026-08-23-context-matrix-replay-probe.md`
- summary reason:
  - run log 5건 기준을 충족해 라운드 2의 observability 검증을 정식 집계로 재작성했다.

## Loop Distribution (루프 분포)
- quick_loop: 1
- full_loop: 4

## Decision Distribution (판정 분포)
- approved: 1
- approved_with_notes: 4
- rejected: 0
- blocked: 0

## Failure Distribution (실패 분포)
- intent_gap: 0
- boundary_conflict: 0
- implementation_bug: 0
- test_failure: 0
- type_error: 0
- build_failure: 0
- performance_risk: 0
- doc_mismatch: 0
- missing_evidence: 2
- external_blocker: 0

## Recurring Patterns (반복 패턴)
- `approved_with_notes`가 반복되며, 그 주요 원인은 구현 결함보다 `missing_evidence` 또는 운영 전제 미확인이다.
- 하네스 개선 작업 자체는 문서 검토와 구조 리뷰로 끝나기 쉬워 실제 적용 evidence가 부족해지기 쉽다.
- probe suite 실행 시 test environment 전제(`vitest` alias)가 빠져 초기 evidence run이 실패했다.
- context-related 작업은 architecture/report row로 matrix에 잘 매핑되며, 문서 선택 패턴 자체의 혼선은 아직 관측되지 않았다.

## Top Follow-up Actions (주요 후속 작업)
- `Quick Code Bundle`에 test-environment preflight 항목을 추가한다.
- 새 `Quick Loop`에 대한 샘플 execution spec / run log 예시를 1건 만든다.
- run log가 더 누적되면 다음 summary에서 loop/decision/failure 추세 변화를 비교한다.

## Harness Improvement Candidates (하네스 개선 후보)
- context selection matrix를 기준 원본으로 운영해 문서 선택 편차를 줄인다.
- `missing_evidence`를 줄이기 위해 evidence bundle별 필수 preflight를 추가한다.
- `approved_with_notes`가 반복되는 경우 notes 원인을 observability summary에서 개선 backlog로 바로 승격하는 규칙을 더 명시한다.
