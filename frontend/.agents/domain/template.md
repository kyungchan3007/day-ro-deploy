# 도메인 온톨로지: <Domain>

## Canonical Term
- `<Domain>`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `<alias>` | `route/code/ui` | `<설명>` |

## Domain Goal
- 이 도메인이 사용자에게 제공하는 핵심 가치를 1~2줄로 적는다.

## 읽어야 하는 경우
- 어떤 라우트, widget, feature, shared/static 경로를 수정할 때 읽어야 하는지 적는다.
- 어떤 사용자 흐름이나 테스트를 건드릴 때 읽어야 하는지 적는다.

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/example` | Route | `src/app/example/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/...` |
| `widgets` | `src/widgets/...` |
| `features` | `src/features/...` |
| `shared/static` | `src/shared/static/...` |
| `shared/ui` | `<필요 시>` |

## 사용자 플로우
1. 진입
2. 핵심 행동
3. 종료 또는 handoff

## Subflows

| Subflow | 목적 | Owner |
| --- | --- | --- |
| `<Subflow>` | `<설명>` | `<경로>` |

## Entities

| 용어 | 상태 | 설명 |
| --- | --- | --- |
| `<Entity>` | `<개념 수준>` | `<설명>` |

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `<ValueObject>` | `<shape>` | `<경로>` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `<Action>` | `<행동>` | `<결과>` |

## States

| State | 의미 |
| --- | --- |
| `<State>` | `<설명>` |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| `<StateA>` | `<Action>` | `<StateB>` | `<조건>` |

## Invariants
- 항상 참이어야 하는 규칙을 테스트 가능한 문장으로 적는다.
- UI, 상태, 전이, 서버 경계에 대한 금지 규칙이 있으면 함께 적는다.

## UI 계약
- 반드시 보여야 하는 정보
- 접근성 필수 요소
- 공용 UI 우선 사용 대상과 예외

## SSR / BFF / 데이터 규칙
- 초기 렌더에 필요한 데이터인지
- Server Component 또는 SSR 준비 위치
- 클라이언트 fetch 허용 조건
- 금지 패턴

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `<Artifact>` | UIArtifact | `<경로>` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `<개념>` | `<경로>` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `<Source>` | `hasRoute / hasSubflow / renders / uses / dependsOn` | `<Target>` |

## Out Of Scope
- 현재 도메인이 소유하지 않는 기능

## 테스트 포인트
- 단위 테스트 우선 항목
- 통합 또는 e2e 우선 항목
- 회귀가 자주 나는 지점

## Validation Rules
- ValidationAgent가 반드시 확인해야 하는 구조 규칙
- widget / feature / shared 경계 규칙
- 상태 전이 또는 카피 일치 규칙
