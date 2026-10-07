# Orchestration Engineering

이 디렉터리는 역할 문서를 넘어 작업을 어떻게 분해하고 연결할지 정의한다.

## 목적
- Architecture, Feature, Test, Validation 역할을 단순 목록이 아니라 handoff 가능한 실행 그래프로 연결한다.
- 큰 작업을 병렬 가능 단위와 순차 의존 단위로 나눈다.
- Claude와 Codex가 같은 intent와 evidence contract를 공유하며 분리 실행할 수 있는 기준을 고정한다.

## 범위
- `Task Decomposition`
  - 큰 작업을 어떤 단위로 쪼갤지 정한다.
- `Task DAG`
  - 어떤 노드가 선행 조건인지와 어떤 노드가 병렬 후보인지 정한다.
- `Delegation`
  - 어떤 역할 또는 subagent가 어떤 입력과 완료 기준으로 작업을 이어받는지 정한다.
- `Worktrees and Subagents`
  - 독립 변경 묶음이 필요할 때 worktree와 별도 실행 단위를 어떻게 쓸지 정한다.
- `Automations`
  - 반복 가능한 분해, handoff, 요약, 후속 실행을 어느 지점까지 자동화할지 정한다.

## 기본 오케스트레이션 모델
- 기본값은 `MCP-connected dual-runtime multi-agent DAG`다.
- 기본 운영은 `Claude UI/UX and design-system work + Codex business-logic and quality gate`다.
- Claude는 UI/UX 구현, UI/UX 판단 보조, 디자인 시스템 설계/구현/수정을 기본 담당한다.
- Codex는 비즈니스 로직 설계/구현, 코드리뷰, 단위 테스트, validation, review gate를 기본 담당한다.
- Claude와 Codex는 서로를 MCP로 호출할 수 있지만, 하나의 task에는 명시적 coordinator를 하나만 둔다.
- Test scope는 단위 테스트까지만 Codex 기본 책임으로 두며, e2e 테스트는 사용자가 직접 확인하거나 명시적으로 명령할 때만 실행한다.
- 선행 의존이 강한 단계는 순차로 진행한다.
- 테스트 대상 분리, 리포트 작성, 문서 정리는 병렬 후보로 본다.

## 기본 운영 모드
- `MCP-connected dual-runtime multi-agent DAG`
  - task 시작 runtime이 coordinator 후보가 되지만, coordinator는 task meta 또는 handoff에 명시해야 한다.
  - Claude는 UI/UX 또는 디자인 시스템 변경 owner로서 필요한 구현과 self-check를 수행한다.
  - Codex는 비즈니스 로직 변경 owner이자 코드리뷰, 단위 테스트, validation gate owner다.
  - Claude가 coordinator인 경우에도 비즈니스 로직, 단위 테스트, 최종 검증은 Codex gate를 호출해야 한다.
  - Codex가 coordinator인 경우 UI/UX 또는 디자인 시스템 작업은 Claude를 owner로 호출할 수 있다.
  - 현재 기본 운영이다.
- `same-thread role switching`
  - 하나의 대화/세션 안에서 Architecture -> Feature -> Test -> Validation 역할을 순서대로 전환한다.
  - 작은 작업 또는 단일 런타임만 사용할 수 있을 때의 fallback이다.
- `session split`
  - 별도 세션 또는 별도 실행 묶음으로 역할을 분리한다.
  - 장기 작업, 문맥 오염 위험, 독립 검증 가치가 높을 때 사용한다.
- `subagent / worktree expansion`
  - 실제 병렬 작업 또는 독립 변경 묶음 분리가 필요할 때만 고려한다.
  - 현재 기본 운영은 아니다.

## 표준 단계
1. `Intent`
2. `Context`
3. `Architecture Decision`
4. `Implementation`
5. `Testing`
6. `Validation`
7. `Report and Follow-up`

## 역할 전환 기본 규칙
- 작은 작업은 same-thread fallback을 사용할 수 있다.
- 중간 이상 작업은 기본적으로 Claude와 Codex 사이의 MCP 호출 또는 handoff 기반 실행으로 본다.
- 같은 대화 안 역할 전환 시에도 역할 책임과 evidence owner는 문서상으로 분리해서 본다.
- 구현 owner와 최종 검증 owner가 다르면 handoff를 기본값으로 작성한다.
- handoff 생략은 `역할이 바뀐다`는 사실보다 `인계 정보가 없어도 다음 단계 품질이 유지되는가`를 기준으로 판단한다.

## Coordinator 규칙
- 하나의 task에는 coordinator를 하나만 둔다.
- coordinator는 task DAG, 현재 stage, 다음 owner, handoff 필요 여부를 관리한다.
- Claude가 coordinator이면 비즈니스 로직, 단위 테스트, 검증 단계에서 Codex gate를 호출한다.
- Codex가 coordinator이면 UI/UX 또는 디자인 시스템 작업에서 Claude를 owner로 호출한다.
- 양방향 MCP 호출은 허용하지만 recursive call chain은 금지한다.
- 호출받은 runtime은 자기 역할의 output만 반환하고 다시 상대 runtime을 호출하지 않는다.

## MCP 연결 규칙
- Claude와 Codex 간 직접 호출은 MCP server가 등록되고 승인된 경우에만 사용한다.
- MCP가 등록됐지만 승인 대기 상태이면 session split 또는 file-based handoff로 fallback한다.
- MCP 호출 결과는 handoff log, run log, validation report 중 하나에 요약한다.
- MCP 실패는 생략하지 않고 `external_blocker` 또는 `missing_evidence`로 분류한다.

## Handoff 계약
각 단계는 다음 단계에 아래 정보를 넘긴다.

- 입력 intent
- 변경 범위
- 경계 판단
- 미해결 리스크
- 필요한 evidence
- 완료 기준

delegation은 handoff보다 넓은 개념이다.

- handoff:
  - 이미 진행 중인 같은 task를 다음 owner에게 넘기는 것
- delegation:
  - 하위 task를 분리해 다른 역할 또는 subagent에 맡기는 것

## Handoff 필수 조건
아래 중 하나라도 해당하면 handoff log를 기본값으로 작성한다.

- Claude와 Codex가 같은 task를 나눠 수행할 때
- 구현 owner와 최종 검증 owner가 다를 때
- MCP 호출이 실패하거나 승인 대기 상태라 file-based handoff로 대체할 때
- 같은 task를 다음 세션에서 이어갈 때
- `approved_with_notes`, `rejected`, `blocked` 이후 재진입할 때
- 구현 단계와 검증 단계 사이에 미해결 리스크가 남아 있을 때
- 여러 역할이 같은 작업을 비동기적으로 이어받을 때
- 큰 작업에서 다음 owner가 꼭 알아야 할 boundary/evidence 조건이 있을 때

## Handoff 생략 가능 조건
아래를 모두 만족하면 handoff를 생략할 수 있다.

- same-thread role switching fallback
- 작은 작업 또는 단순 중간 작업
- 미해결 리스크가 거의 없음
- validation에 필요한 evidence와 범위가 명확함
- 구현 owner와 최종 검증 owner가 같은 단일 런타임 안에 있음

## 작업 분해 규칙
- 아래 중 하나라도 해당하면 하위 작업 분해를 검토한다.
  - 서로 다른 도메인 2개 이상 동시 변경
  - 구현과 검증 경계가 크게 다른 작업
  - 전역 구조와 기능 구현이 함께 묶인 작업
  - 공용 UI API 변경과 feature 변경이 동시에 발생

분해된 task는 가능하면 각자 별도 intent artifact를 가진다.

## 세션 분리 조건
아래 중 하나라도 해당하면 `session split`을 검토한다.

- 하루 이상 이어질 가능성이 높은 작업
- 독립 검증 가치가 큰 구현 묶음이 2개 이상 존재
- 큰 구조 개편과 기능 구현이 함께 진행된다
- notes/reject 이후 재진입인데 이전 맥락이 길고 복잡하다
- 같은 대화 안에서 역할 전환만으로는 인계 품질이 떨어진다
- Claude 구현과 Codex 검증을 분리하는 편이 evidence 신뢰도를 높인다
- MCP 승인 또는 연결 상태가 불안정해서 직접 호출보다 파일 기반 인계가 안전하다

## DAG 규칙
- intent와 acceptance 기준이 고정되기 전에는 구현 노드를 열지 않는다.
- architecture decision 없이 shared 승격, server/client boundary 변경 노드를 열지 않는다.
- evidence가 없으면 validation decision 노드를 닫지 않는다.
- automation이 있더라도 위 DAG 규칙을 우회하지 않는다.

## 장기 작업 규칙
- 장기 작업은 가능한 한 `milestone` 단위로 나눈다.
- milestone마다 최소한 execution spec과 필요한 handoff artifact를 남긴다.
- 장기 작업에서 run log는 milestone 경계마다 남기는 것을 권장한다.
- 장기 작업 summary가 필요하면 observability summary와 handoff log를 함께 참조한다.

## Subagent / Worktree 확장 규칙
- 현재 기본 운영은 단일 worktree에서 Codex와 Claude가 MCP 호출 또는 handoff로 협업하는 실행이다.
- 아래 조건이면 별도 worktree 또는 subagent 확장을 고려한다.
  - 대규모 구조 개편
  - 장기 작업에서 독립 변경 묶음이 2개 이상 존재
  - 병렬 검증 가치가 높은 경우
- 확장 시에도 intent artifact와 handoff contract는 공유해야 한다.

## 운영 우선순위
1. MCP-connected dual-runtime multi-agent DAG
2. same-thread role switching fallback
3. session split
4. subagent / worktree expansion

복잡도를 불필요하게 올리지 않기 위해 항상 위 순서대로 검토한다.
