# AI Agent Operating Architecture

## 목적
이 저장소의 AI 하네스는 문서가 많아지는 방향이 아니라, 기준 원본이 분명한 구조로 운영한다.

에이전트는 아래 4개 축을 기준으로 작업한다.

- `Intent Engineering`
- `Context Engineering`
- `Harness Engineering`
- `Orchestration Engineering`

`aiagent.yaml`은 실행 강제 파일이 아니라 온톨로지와 운영 모델 참고 문서다.

## Canonical Source 원칙
같은 규칙을 여러 문서에 반복하지 않는다.

- 작업 입력 기준 원본:
  - `.agents/intent/README.md`
- 역할별 행동 기준 원본:
  - `.agents/agents/*.md`
- 기술/구조 규칙 원본:
  - `.agents/guides/*.md`
- 도메인 개념/상태/전이/invariant 원본:
  - `.agents/domain/*.md`
- 실행 루프/증거/관측 기준 원본:
  - `.agents/harness/*.md`
- 역할 간 handoff / task decomposition 기준 원본:
  - `.agents/orchestration/README.md`
- 리포트 저장 기준 원본:
  - `.agents/reports/README.md`

이 문서는 전체 운영 모델과 문서 선택 규칙만 정의한다.
세부 기술 규칙, 검증 항목, 역할별 세부 절차는 해당 원본 문서로 위임한다.

## 4축 정의
### Intent Engineering
- 작업마다 `PRD`, `SDD`, `Execution Spec` 중 필요한 계층을 먼저 고정한다.
- 모든 작업은 최소한 `Execution Spec`을 가지되, 작은 작업은 대화 내 inline Execution Spec을 허용한다.
- 작업 규모에 따라 `.agents/intent/prd/`, `.agents/intent/sdd/`, `.agents/intent/tasks/`를 사용한다.
- 현재 작업 context는 먼저 `.agents/intent/active/`에서 찾는다.
- 도메인 문서나 가이드 문서가 intent를 대신하지 않는다.

### Context Engineering
- 역할 문서, 가이드, 도메인 문서를 트리거에 따라 읽는다.
- Context는 재사용 기준 문서 계층이다.
- 도메인 지식은 `domain`, 횡단 규칙은 `guides`, 역할 규칙은 `agents`에 둔다.

### Harness Engineering
- 작업은 evidence-gated loop로 실행한다.
- loop, gate, observability, report 규칙은 `.agents/harness/*`, `.agents/reports/*`가 원본이다.
- 테스트 통과만으로 완료를 주장하지 않는다.

### Orchestration Engineering
- 역할 간 순서, handoff, 분해 규칙은 `.agents/orchestration/README.md`가 원본이다.
- 기본값은 MCP-connected dual-runtime multi-agent DAG다.
- 기본 운영은 Claude가 UI/UX와 디자인 시스템 작업을 맡고 Codex가 비즈니스 로직, 코드리뷰, 단위 테스트, 검증을 맡는 협업이다.
- Claude와 Codex는 서로를 MCP로 호출할 수 있지만, 하나의 task에는 명시적 coordinator를 하나만 둔다.
- same-thread role switching은 작은 작업 또는 단일 런타임만 사용할 수 있는 경우의 fallback이다.
- 구현 owner와 최종 검증 owner가 다르면 handoff artifact를 기본값으로 남긴다.

## 시작 전 필수 판단
모든 작업은 시작 전에 아래를 먼저 결정한다.

1. 작업 유형
   - `아키텍처`
   - `기능 구현`
   - `테스트`
   - `검증`
2. intent artifact 필요 여부
3. 관련 도메인 여부
4. 어떤 guide trigger가 해당하는지
5. handoff 또는 run log가 필요한 규모인지

위 판단이 끝나기 전에는 구현, 테스트, 검증 결론을 시작하지 않는다.

## 문서 선택 순서
작업 시 기본 읽기 순서는 아래를 따른다.

1. `.agents/README.md`
2. `.agents/intent/README.md`
3. `.agents/intent/active/index.md`
4. 해당 역할 문서 `.agents/agents/*.md`
5. 트리거에 맞는 `.agents/guides/*.md`
6. 관련 `.agents/domain/*.md`
7. 필요 시 `.agents/harness/*.md`
8. 큰 작업이면 `.agents/orchestration/README.md`

제외: `.agents/onboarding.md`는 사람용 온보딩 문서다. 위 읽기 순서에 포함하지 않으며, Claude·Codex 모두 사용자가 명시적으로 지시하기 전에는 작업 참조로 읽지 않는다.

## Guide Trigger 규칙
아래 조건이면 해당 guide가 기준 원본이 된다.

- UI/마크업/인터랙션:
  - `.agents/guides/accessibility.md`
- `use client`, 상태, effect, 브라우저 API, overlay orchestration:
  - `.agents/guides/client-logic-separation.md`
- SSR, Server Component, Route Handler, `next/headers`, feature barrel export:
  - `.agents/guides/server-client-boundary.md`
- BFF/API/auth/session/cookie:
  - `.agents/guides/bff.md`
- 전역 구조, 초기 렌더, CWV, middleware, auth path, 성능 검토:
  - `.agents/guides/performance.md`
- `src/shared/ui` 또는 story:
  - `.agents/guides/storybook.md`

세부 규칙은 이 문서에 다시 쓰지 않는다.

## Intent 필수 규칙
acceptance criteria가 없으면 구현, 테스트, 검증을 시작하지 않는다.

아래 중 하나라도 해당하면 작업별 intent 문서를 기본값으로 본다.

- 파일 3개 이상 수정
- SSR/BFF/auth/session/cookie 포함
- 공용 UI API 변경
- 성능 또는 전역 구조 변경
- 다음 세션으로 이어질 가능성이 높은 작업

아래를 모두 만족하면 대화 내 inline Execution Spec을 허용한다.

- 파일 2개 이하 수정
- 경계 판단이 이미 명확함
- 다음 세션으로 이어질 가능성이 낮음
- SSR/BFF/auth/session/shared UI/performance 영향이 없음

중간 이상 작업은 `SDD`를 함께 사용한다.
큰 작업은 `PRD + SDD + Execution Spec`을 함께 사용한다.

intent 문서(task·SDD)는 **착수 전 또는 작업 중 실시간으로** 남긴다. 완료 후 **소급 작성은 금지한다.** 이 문서는 AI의 판단·경계 결정을 실시간으로 드러내는 유일한 기록(black box를 볼 수 있는 구간)이므로, 사후에 재구성하면 실제 추론이 아니라 결과에 꿰맞춘 서술이 되어 근거로서의 의미가 사라진다. medium 이상(위 트리거) 작업을 intent 문서 없이 inline으로 진행했다면, 소급 작성하지 말고 그 **누락 사실만** 기록에 남긴다(아카이브 블록·run log 등).

## Loop 필수 규칙
모든 작업은 아래 단계 모델을 따른다.

1. `Intent Capture`
2. `Context Load`
3. `Plan and Boundary Decision`
4. `Implement`
5. `Self Check`
6. `Evidence Run`
7. `Validate`
8. `Report`

다음 gate를 통과하지 못하면 다음 단계로 진행하지 않는다.

- `Intent Gate`
- `Boundary Gate`
- `Evidence Gate`
- `Report Gate`

세부 정의는 `.agents/harness/README.md`가 원본이다.

## 사용자 요청과 문서 충돌
문서와 현재 요청이 다르면 바로 구현하지 않는다.

먼저 아래 셋 중 하나를 사용자에게 확인한다.

1. 문서 기준으로 작업
2. 새 요청 기준으로 작업하고 문서도 함께 수정
3. 새 요청 기준으로 작업하고 문서 수정은 후속으로 분리

## 시작 응답 필수 항목
첫 작업 응답에는 아래를 반드시 포함한다.

- 작업 유형
- 이번 작업 전에 읽은 문서 목록
- 문서와 현재 요청의 충돌 여부

## 검증 시작 응답 필수 항목
사용자가 `검증`, `코드 검증`, `리뷰`, `확인`, `체크`를 요청하면 실제 검증 전에 아래를 먼저 답한다.

- 이번 검증 작업 유형 분류
- 이번 검증 전에 읽은 문서 목록
- 구현 기준 문서 목록
- 검증 기준 문서 목록
- guide trigger 체크 결과와 근거
- 제외 문서와 제외 이유
- 문서와 현재 요청의 충돌 여부

세부 검증 절차는 `.agents/agents/validation.md`가 원본이다.

## 승인 필요한 작업
아래 작업은 사용자 승인이 필요하다.

- 의존성 설치
- 파일 삭제
- 대규모 리팩터링
- 프로덕션 설정 변경
- 외부 네트워크 접근
- `git push`
- `git reset`
- `git clean`

## 범위
에이전트는 아래만 수행한다.

- VSA 아키텍처 설계와 구조 리뷰
- 기능 구현
- 단위 테스트 작성 및 실행
- 구현 결과 검증
- 변경 내역과 검증 결과 보고

e2e 테스트는 사용자가 직접 확인하거나 명시적으로 명령할 때만 실행한다.
디자인 방향성 결정은 하지 않는다.

## 최종 보고 필수 항목
최종 보고에는 아래를 반드시 포함한다.

- intent source
- acceptance criteria 요약
- 이번 작업 전에 읽은 문서 목록
- 각 문서가 어떤 결정에 반영되었는지 한 줄 요약
- 문서와 충돌한 항목
- 사용자 확인 결과
- 수정한 문서
- evidence 요약
- loop 반복 여부
- 남은 문서 불일치
- 공용 UI 재사용 여부
- 공용 UI를 재사용하지 않았다면 그 이유

## 우선순위
규칙 충돌 시 우선순위는 아래를 따른다.

1. 사용자 직접 지시
2. `AGENTS.MD`
3. `.agents/intent/*`
4. `.agents/agents/*`
5. `.agents/guides/*`
6. `.agents/domain/*`
7. `.agents/harness/*`
8. `.agents/orchestration/*`
9. `.agents/skills/*`
10. `aiagent.yaml`

## 커밋 컨벤션
커밋 메시지는 아래 형식을 따른다.

```
<YYYY-MM-DD> FE <label> <설명>
```

- `<YYYY-MM-DD>`: 커밋하는 날의 날짜
- `FE`: 프론트엔드 작업 표시(고정)
- `<label>`: 아래 라벨 중 하나
- `<설명>`: 무엇을 바꿨는지 한 줄 요약

예: `2026-08-29 FE chore intent hot/cold 아카이브 체계 전환`

### 라벨 정의
| label | 사용 시점 |
|---|---|
| `feat` | 기능 개발, 기능 추가, 기능 수정 |
| `docs` | 설계 문서 등 문서 내용 수정 |
| `refactor` | 코드 리팩토링, 성능 개선 |
| `chore` | 프로젝트 배포 관련 문서, AI 아키텍처(`.agents`, `AGENTS.MD`, `CLAUDE.md` 등) md 파일 수정 |
| `bug` | 오류 수정 |
| `test` | 테스트 코드 작성 |
| `style` | UI/UX 추가, 수정 |

- 한 커밋에는 하나의 라벨만 쓴다. 성격이 다른 변경은 커밋을 나눈다.
