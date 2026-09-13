# Context Engineering

이 디렉터리는 에이전트가 어떤 기준 원본을 어떻게 읽고, 어떤 컨텍스트를 세션 동안 유지할지 정의한다.

## 목적
- 필요한 문서만 점진적으로 읽어도 경계 판단이 가능하게 만든다.
- 정적 기준 원본과 세션성 메모리를 구분한다.
- context loading 비용을 낮추면서도 canonical source 원칙을 지킨다.

## 책임
- `Canonical Sources`
  - 어떤 문서가 어떤 종류의 판단에 대한 기준 원본인지 정의한다.
- `Context Loading Policy`
  - 작업 유형과 trigger에 따라 어떤 문서를 먼저 읽어야 하는지 정한다.
- `Progressive Disclosure`
  - 필요한 문서만 추가 로딩하는 순서와 중단 기준을 정한다.
- `Session Memory`
  - 현재 세션에서 고정된 intent, boundary decision, 미해결 리스크를 어떻게 유지할지 정한다.

## Canonical Sources
- 작업 입력:
  - `.agents/intent/README.md`
- 역할별 행동:
  - `.agents/agents/*.md`
- 기술/구조 규칙:
  - `.agents/guides/*.md`
- 도메인 개념/상태/전이/invariant:
  - `.agents/domain/*.md`
- 실행 루프, evidence, observability:
  - `.agents/harness/*.md`
- 분해, handoff, delegation:
  - `.agents/orchestration/README.md`
- 보고 산출물:
  - `.agents/reports/README.md`
- 전역 운영 규칙:
  - `AGENTS.md`

## Context Loading Policy
기본 읽기 순서는 아래를 따른다.

1. `AGENTS.md`
2. `.agents/README.md`
3. `.agents/intent/README.md`
4. `.agents/intent/active/index.md`
5. 해당 역할 문서 `.agents/agents/*.md`
6. 관련 guide `.agents/guides/*.md`
7. 관련 domain `.agents/domain/*.md`
8. 필요 시 `.agents/harness/*.md`
9. 큰 작업이면 `.agents/orchestration/README.md`
10. 검증/보고 작업이면 `.agents/reports/README.md`

기본 읽기 중에는 `.agents/intent/sdd/*.md`와 `.agents/intent/tasks/*.md` 전체를 스캔하지 않는다.
active index가 연결한 파일 또는 사용자가 지정한 파일만 추가로 읽는다.

## Context Selection Matrix
아래 표는 자주 발생하는 작업 유형에서 어떤 문서를 기본값으로 읽어야 하는지 빠르게 고르기 위한 운영 매트릭스다.

| task type | trigger | required docs | additional docs | skippable docs |
| --- | --- | --- | --- | --- |
| `아키텍처` | 운영 구조 / 문서 체계 / 하네스 규칙 변경 | `AGENTS.md`, `.agents/README.md`, `.agents/intent/README.md`, `.agents/intent/active/index.md`, `.agents/agents/architecture.md`, `.agents/context/README.md` | `.agents/harness/*.md`, `.agents/orchestration/README.md`, `.agents/reports/README.md` | 관련 없는 `domain/*.md`, `guides/*.md`, 연결되지 않은 과거 intent |
| `기능 구현` | 순수 client logic / UI interaction | `AGENTS.md`, `.agents/README.md`, `.agents/intent/README.md`, `.agents/intent/active/index.md`, `.agents/agents/feature.md`, 관련 `domain/*.md` | `client-logic-separation.md`, `accessibility.md`, 필요 시 `.agents/harness/README.md` | BFF/server guide, 관련 없는 domain, 연결되지 않은 과거 intent |
| `기능 구현` | SSR / BFF / auth / session / API contract | `AGENTS.md`, `.agents/README.md`, `.agents/intent/README.md`, `.agents/intent/active/index.md`, `.agents/agents/feature.md`, 관련 `domain/*.md`, `server-client-boundary.md`, `bff.md` | `performance.md`, `.agents/orchestration/README.md`, `.agents/harness/README.md` | 관련 없는 UI/accessibility guide, 연결되지 않은 과거 intent |
| `테스트` | 단위 테스트 / e2e / 구조 회귀 | `AGENTS.md`, `.agents/intent/README.md`, `.agents/intent/active/index.md`, `.agents/agents/test.md`, 관련 `domain/*.md` | 관련 `guides/*.md`, `.agents/harness/README.md` | 관련 없는 orchestration / reports, 연결되지 않은 과거 intent |
| `검증` | 코드 리뷰 / evidence 확인 / 최종 판정 | `AGENTS.md`, `.agents/intent/README.md`, `.agents/intent/active/index.md`, `.agents/agents/validation.md`, `.agents/context/README.md`, `.agents/harness/*.md`, `.agents/reports/README.md` | 관련 `domain/*.md`, 관련 `guides/*.md`, 필요 시 `.agents/orchestration/README.md` | 관련 없는 domain/guides, 연결되지 않은 과거 intent |
| `보고` | run log / validation report / summary 작성 | `AGENTS.md`, `.agents/intent/README.md`, `.agents/reports/README.md`, `.agents/harness/observability.md` | `.agents/reports/runs/*.md`, `.agents/reports/validation/*.md` | 관련 없는 domain / feature guide |

### Matrix 사용 규칙
- 먼저 `task type`과 가장 강한 `trigger`를 고른다.
- `required docs`를 다 읽었는데도 경계가 닫히지 않으면 `additional docs`를 순서대로 연다.
- `skippable docs`는 현재 판단에 직접 쓰이지 않으면 읽지 않는다.
- 하나의 작업이 여러 row에 걸치면 더 무거운 row를 우선한다.
  - 예:
    - 단순 UI 수정처럼 보여도 auth/session/BFF가 있으면 `SSR / BFF / auth / session / API contract` row를 따른다.
    - 구현 이후 최종 확인 단계로 넘어가면 `검증` row를 다시 적용한다.

## Progressive Disclosure 규칙
- 모든 문서를 한 번에 읽지 않는다.
- 현재 작업의 task type, guide trigger, domain relevance로 1차 문서를 고른다.
- intent는 active index를 먼저 보고, 연결된 current/dedicated spec만 읽는다.
- archive는 과거 decision이 현재 판단에 직접 필요할 때만 연다.
- 경계가 닫히지 않으면 다음 계층 문서를 추가로 읽는다.
- 이미 역할 문서나 상위 README가 위임한 세부 규칙은 해당 원본 문서를 직접 읽고 판단한다.
- 관련 없는 domain/guide는 읽지 않는다.

## Session Memory
세션 메모리는 기준 원본을 대체하지 않는다.

- 세션 메모리에 남길 것:
  - 현재 task id
  - acceptance criteria 요약
  - boundary decision
  - 열린 질문
  - evidence 상태
- 세션 메모리에 남기지 않을 것:
  - domain/guides의 세부 규칙 재복사
  - 장기 보존이 필요한 정책 결정 원문

세션을 넘겨야 하는 경우에는 memory가 아니라 handoff artifact를 남긴다.

## 운영 원칙
- context는 많을수록 좋은 것이 아니라, 현재 결정을 안전하게 내릴 만큼 충분해야 한다.
- 같은 규칙을 여러 문서에 반복하지 않는다.
- 문서와 실제 요청이 충돌하면 사용자 확인 없이 암묵적으로 덮어쓰지 않는다.
