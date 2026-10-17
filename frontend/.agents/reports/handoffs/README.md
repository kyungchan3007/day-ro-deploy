# Handoff Logs

이 디렉터리는 역할 간 handoff 내용을 남길 때 사용한다.

## 사용 시점
- 장기 작업
- 병렬 작업
- Claude와 Codex가 같은 task를 나눠 수행할 때
- 구현 owner와 최종 검증 owner가 다를 때
- 동일 작업을 다음 세션에서 이어갈 때
- validation reject 이후 재진입할 때
- 구현 단계와 검증 단계 사이에 미해결 리스크가 남을 때

## 최소 포함 항목
- 현재 단계
- 완료된 단계
- 남은 acceptance criteria
- 미해결 리스크
- 다음 단계 owner
- agent runtime
- coordinator
- mcp status
- claimed scope
- handoff contract
- 필요한 evidence

## 작성 템플릿

```md
# Handoff - <task_id>

## Meta (기본 정보)
- date:
- from:
- to:
- from_runtime:
- to_runtime:
- coordinator:
- mcp_status:
- current_stage:
- handoff_reason:
- next_mode:

## Ownership (소유권)
- implementation_owner:
- validation_owner:
- review_owner:
- gate_owner:
- claimed_scope:

## Completed (완료된 내용)
- 

## Remaining Acceptance Criteria (남은 완료 조건)
- 

## Open Risks (미해결 리스크)
- 

## Required Evidence (필요한 증거)
- 

## Handoff Contract (인계 계약)
- input_artifacts:
- output_expected:
- evidence_required:
- must_not_change:
- recursive_call_allowed:

## Next Recommended Action (다음 권장 액션)
- 
```

## handoff_reason 예시
- `next_session`
- `validation_reentry`
- `async_role_switch`
- `risk_carryover`
- `parallel_split`
- `codex_to_claude_uiux`
- `codex_to_claude_design_system`
- `claude_to_codex_business_logic`
- `claude_to_codex_architecture`
- `claude_to_codex_unit_test`
- `claude_to_codex_validation`
- `mcp_pending_approval`
- `mcp_call_failed`

## next_mode 예시
- `same-thread`
- `session-split`
- `subagent`
- `worktree`
- `codex-claude-handoff`
- `mcp-direct-call`
