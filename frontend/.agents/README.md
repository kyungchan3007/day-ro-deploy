# Agentic Engineering Index

이 디렉터리는 Dayro 프론트엔드 에이전트 운영 체계를 `Agentic Engineering` 기준으로 나눈다.

## 4축
- `intent/`
  - `Intent Engineering`
  - PRD, SDD, Execution Spec, acceptance criteria 기준
- `context/`
  - `Context Engineering`
  - canonical source, context loading, session memory, progressive disclosure 기준
- `harness/`
  - `Harness Engineering`
  - loop, tool/environment, eval, observability, guardrails 기준
- `orchestration/`
  - `Orchestration Engineering`
  - task decomposition, DAG, delegation, subagents/worktrees, automations 기준

## 지원 계층
- `agents/`
  - 역할별 행동 기준
- `guides/`
  - 횡단 기술 규칙 기준
- `domain/`
  - 도메인 개념과 invariant 기준
- `reports/`
  - 산출물 저장 기준
- `skills/`
  - 역할별 사용 가능 skill

## Canonical Source Map
- intent artifact 정의:
  - `intent/README.md`
- context loading / canonical source / memory:
  - `context/README.md`
- 역할 행동:
  - `agents/*.md`
- 접근성, BFF, 경계, 성능, Storybook:
  - `guides/*.md`
- 용어, 상태, 전이, invariant:
  - `domain/*.md`
- 실행 단계, gate, evidence, eval, observability:
  - `harness/*.md`
- handoff, delegation, DAG:
  - `orchestration/README.md`
- run log, handoff log, validation report 저장:
  - `reports/README.md`

## 성장 규칙
- 새 도메인 지식이 생기면 `domain/`을 수정하거나 추가한다.
- 새 기술 기준이 생기면 `guides/`를 수정하거나 추가한다.
- 제품 수준 요구가 생기면 `intent/prd/`에 기록한다.
- 경계/설계 판단이 필요한 작업은 `intent/sdd/`에 기록한다.
- 실제 작업 단위 요구사항은 `intent/tasks/`에 기록한다.
- context loading 또는 memory 규칙이 바뀌면 `context/`를 수정한다.
- 공통 실행 규칙이 바뀌면 `harness/`를 수정한다.
- 역할 연결 규칙이 바뀌면 `orchestration/`을 수정한다.
- 역할 행동이 바뀌면 `agents/`를 수정한다.

## 운영 시작 순서
새 체계로 실제 작업을 시작할 때는 아래 순서를 기본값으로 쓴다.

1. `intent/tasks/README.md` 템플릿으로 intent artifact 작성
   큰 작업이면 `intent/prd/README.md`, `intent/sdd/README.md`도 먼저 선택
2. `context/README.md` 기준으로 읽을 역할/guide/domain/harness 문서 선택
3. 구현 후 필요 시 `reports/handoffs/README.md` 템플릿으로 handoff 작성
4. 검증 후 `reports/README.md` 템플릿으로 validation report 작성
5. 루프 반복, reject, 후속 리스크가 있으면 `reports/runs/README.md` 템플릿으로 run log 작성

## 금지
- 같은 기준을 `AGENTS.MD`, 역할 문서, 가이드 문서에 반복해서 적지 않는다.
- 작업별 요구사항을 `domain/`이나 `guides/`에 임시로 넣지 않는다.
- 공통 운영 규칙을 개별 도메인 문서에 흩뿌리지 않는다.
