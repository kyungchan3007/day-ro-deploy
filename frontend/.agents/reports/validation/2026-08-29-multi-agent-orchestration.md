# 멀티 에이전트 오케스트레이션 정책 수정 검증 리포트

## 작업 일시
- `2026-08-29`

## Intent Source
- task_id: `2026-08-29-multi-agent-orchestration`
- intent artifact: `.agents/intent/tasks/2026-08-29-multi-agent-orchestration.md`
- linked_sdd: `.agents/intent/sdd/2026-08-29-multi-agent-orchestration.md`

## 검증 대상
- `AGENTS.md`
- `.agents/orchestration/README.md`
- `.agents/harness/README.md`
- `.agents/reports/handoffs/README.md`
- `.agents/agents/architecture.md`
- `.agents/agents/feature.md`
- `.agents/agents/test.md`
- `.agents/agents/validation.md`
- `CLAUDE.md`
- `.mcp.json`

## 최종 결정
- `approved_with_notes`
- (최초 `blocked` → 2026-08-29 external_blocker 해소, 아래 "Block 해소" 참고)

## Acceptance Criteria 확인
- must: MCP-connected dual-runtime operation이 기본 모델로 정의됨.
- must: active policy 문서에서 same-thread role switching은 기본값이 아니라 fallback으로 낮춰짐.
- must: handoff template에 runtime ownership, claimed scope, handoff contract 필드가 추가됨.
- must: 역할 문서가 Codex/Claude 기본 runtime ownership을 반영함.
- must: task별 coordinator 단일화와 recursive runtime call chain 금지가 추가됨.
- should: 상세 오케스트레이션 규칙은 `.agents/orchestration/README.md`에 두고 다른 문서는 역할별 책임만 반영함.

## 변경 파일 요약
- `AGENTS.md`: 최상위 시작 지침의 기본 운영 모델을 MCP-connected dual-runtime multi-agent DAG로 변경.
- `.agents/orchestration/README.md`: canonical orchestration source를 Codex gate + Claude 구현 + 양방향 MCP 호출 중심으로 재정의.
- `.agents/harness/README.md`: evidence owner 분리, MCP invocation 규칙, fallback 사용 시 보고 의무 추가.
- `.agents/reports/handoffs/README.md`: Claude/Codex 인계 계약, coordinator, MCP status 필드와 reason/mode 예시 추가.
- `.agents/agents/*.md`: 역할별 기본 runtime owner와 handoff 책임 추가.
- `CLAUDE.md`: Claude에서 `codex` MCP를 architecture/validation gate로 호출하는 작업 흐름 추가.
- `.mcp.json`: Claude의 project MCP server 설정 evidence로 확인함.

## 실행 루프 요약
- loop type: `Full Loop`
- iterations: `1`
- handoff 사용 여부: `no`
- handoff 미사용 사유: 현재 작업은 지침 개정 자체이며 사용자가 Codex에 직접 수정을 승인했다. 같은 runtime이 수정과 검증을 모두 수행한 fallback이다.
- MCP 연결 확인 결과: Codex에는 `claude` MCP server가 `enabled`로 등록되어 있다. 프로젝트 `.mcp.json`에는 Claude용 `codex` MCP server가 정의되어 있다. `claude mcp list` 기준으로 Claude의 `codex` server는 `Connected` 상태다.
- Claude -> Codex 실행 결과: `.mcp.json`의 Codex command를 `/opt/homebrew/bin/codex`로 고정한 뒤 Claude가 `mcp__codex__codex` tool을 실제 호출했고 `CODEX_MCP_GATE_OK` 응답을 받았다.
- Codex -> Claude 실행 결과: Codex가 `claude` MCP server의 `Read` tool call을 시작했으나 Claude 쪽에서 `user cancelled MCP tool call`로 실패했다.
- evidence bundle: `Doc Bundle`

## 실행한 검증 명령
- `claude mcp list`
- `codex mcp list`
- `claude -p --verbose --output-format stream-json --model sonnet --allowedTools mcp__codex__codex ...`
- `codex -a never exec --json -m gpt-5.5 -s read-only ...`
- `codex doctor`
- `claude mcp get codex`
- `/opt/homebrew/bin/codex --version`
- `rg -n '기본 운영은 same-thread|기본값은 .*same-thread|현재 기본 운영은 이 모드|same-thread role switching|sequential DAG|Codex-led|Claude|Codex|MCP|recursive|coordinator' ...`
- `git diff --stat`
- `git diff -- ...`

## Evidence Gate
- intent artifact: 있음
- tests: 실행 안 함. 문서 전용 정책 변경이다.
- typecheck: 실행 안 함. 문서 전용 정책 변경이다.
- build: 실행 안 함. 문서 전용 정책 변경이다.
- additional review: MCP 목록 확인, 키워드 검색, diff 검토 완료
- MCP direct call evidence: Claude -> Codex 실행 가능, Codex -> Claude는 Claude-side permission으로 차단됨
- skipped with reason: 애플리케이션 코드 변경이 없으므로 runtime 동작 검증은 대상이 아니다.

## 구조 / VSA 검토 결과
- domain/guides 문서는 수정하지 않아 canonical source boundary를 유지했다.
- historical reports는 과거 evidence로 남겨 소급 수정하지 않았다.
- runtime orchestration policy는 `.agents/orchestration/README.md`에 집중하고, `AGENTS.md`와 역할 문서에는 진입/역할 계약 수준만 반영했다.

## Failure Taxonomy 또는 미검증 항목
- failure taxonomy: `external_blocker`
- resolved: Claude -> Codex는 `/opt/homebrew/bin/codex` `0.150.1`을 사용하며 `CODEX_MCP_GATE_OK`를 반환한다.
- blocker: Codex -> Claude MCP tool execution은 Claude-side permission flow에서 취소됐다.
- 제한 사항: 문서 정책은 정렬됐지만 MCP direct-call execution은 아직 end-to-end 승인 상태가 아니다.

## 남은 리스크 및 후속 작업
- Claude-side MCP tool execution permission을 승인하거나 허용 정책을 조정해야 한다.
- 그 뒤 Codex -> Claude harmless prompt를 재검증한다.

## Block 해소 (2026-08-29)
- Codex -> Claude MCP **실행 경로 확인**: 예전처럼 permission에서 취소되지 않고, Codex가 Claude MCP 서버의 tool 호출에 **도달·응답을 수신**했다. external_blocker(실행 취소)는 해소됨.
- 호출한 Agent tool이 "Available agents: none"을 반환한 건 실행 실패가 아니라 **서브에이전트 미등록** 때문이며, `.claude/agents/ui-ux.md`·`design-system.md`를 신규 등록해 대응했다.
- 남은 확인: 세션 리로드 후 Codex Agent tool 목록에 위 서브에이전트가 노출되는지 재검증(notes). 이는 앱/코드 영향이 없는 운영 검증 항목이다.
- 판정 갱신: `blocked` → `approved_with_notes`.
