# Run Logs

이 디렉터리는 최종 승인 리포트가 아니라 실행 루프 관측 로그를 저장한다.

## 언제 저장하는가
- 루프가 2회 이상 반복된 경우
- reject 또는 blocked 판정이 나온 경우
- `approved_with_notes` 이지만 후속 작업이 남는 경우
- 사용자 확인이 필요했던 boundary conflict가 있었던 경우

## 포함 필드
- `task_id`
- `date`
- `task_type`
- `owners`
- `intent_source`
- `documents_loaded`
- `loop_type`
- `current_stage`
- `stages_visited`
- `iterations`
- `decision`
- `failure_stage`
- `failure_reason`
- `evidence_bundle`
- `evidence_summary`
- `next_action`

## 작성 템플릿

```md
# Run Log - <task_id>

## Meta (기본 정보)
- date:
- task_type:
- owners:
- intent_source:
- loop_type:
- iterations:
- decision:

## Documents Loaded (읽은 문서)
- 

## Current Stage (현재 단계)
- 

## Stages Visited (방문한 실행 단계)
- Intent Capture:
- Context Load:
- Plan and Boundary Decision:
- Implement:
- Self Check:
- Evidence Run:
- Validate:
- Report:

## Evidence Summary (증거 요약)
- evidence_bundle:
- commands:
- review:
- skipped_with_reason:

## Failure / Retry (실패 / 재시도)
- failure_stage:
- failure_reason:
- retry_decision:

## Next Action (다음 액션)
- 
```

## Summary 연계 규칙
- 같은 task_id의 run log는 summary artifact 집계 대상이 된다.
- `failure_reason: none`이어도 `decision: approved_with_notes`면 notes 사유를 summary에서 분리 집계한다.
