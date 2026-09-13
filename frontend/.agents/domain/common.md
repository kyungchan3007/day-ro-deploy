# 공통 온톨로지

## 목적
이 문서는 Dayro 프론트엔드 도메인 문서에서 사용하는 표준 온톨로지를 정의한다.

`.agents/domain/` 아래의 모든 도메인 문서는 다음 요소를 기준으로 작성한다.
- canonical term
- alias
- 개념 타입
- 관계 타입
- invariant
- 소유권 경계

## 모델링 규칙

### 관심사 분리
- 비즈니스 개념과 구현 개념은 분리해서 기록한다.
- 도메인 문서에서 구현 아티팩트를 참조할 수는 있지만, 구현 아티팩트 자체를 도메인 개념으로 취급하지 않는다.

### 정규 명명
- 모든 핵심 개념은 하나의 canonical term을 가져야 한다.
- 코드 경로, UI 라벨, 문서 용어가 다르면 alias로 명시한다.

### 허용 개념 타입
- `Domain`
- `Subflow`
- `Entity`
- `ValueObject`
- `Action`
- `State`
- `Transition`
- `Route`
- `UIArtifact`
- `StaticResource`
- `ImplementationOwner`

### 도메인 문서 필수 섹션
각 도메인 문서는 아래 섹션을 포함해야 한다.

1. Canonical Term
2. Aliases
3. Domain Goal
4. Entry Routes
5. Subflows
6. Entities
7. Value Objects
8. Actions
9. States
10. Transitions
11. Invariants
12. Owned UI Artifacts
13. Owned Implementation
14. External Relations
15. Out Of Scope
16. Validation Rules

## 정규 용어

| 용어 | 타입 | 정의 |
| --- | --- | --- |
| `Home` | Domain | 사용자가 앱 진입 직후 다음 주요 행동을 선택하는 최상위 진입 허브 |
| `Login` | Domain | 인증 의도를 시작하는 로그인 진입 도메인 |
| `Course` | Domain | 코스 생성 도메인. 현재 구현 범위는 `/course/new`와 그 안의 step 흐름 |
| `SituationInput` | Subflow | `Course` 내부에서 코스 생성 조건을 수집하는 단계형 입력 흐름 |

## Alias

| Canonical Term | Alias | 설명 |
| --- | --- | --- |
| `Login` | `auth` | 코드 경로는 `features/auth`, `widgets/auth`를 사용하지만 도메인 이름은 `Login`이다. |
| `SituationInput` | `situation` | feature, widget 경로에서 `situation`이라는 이름을 사용한다. |
| `Course` | `course new` | 현재 구현은 `Course` 전체가 아니라 새 코스 생성 분기만 포함한다. |

## 개념 타입 정의

### Domain
사용자 목표를 기준으로 구분되는 안정적인 상위 경계다.

### Subflow
하나의 Domain 내부에 속한 제한된 워크플로다.

### Entity
상태가 바뀌거나 상호작용이 이어져도 식별성을 유지하는 개념이다.

### ValueObject
식별성보다 구조와 의미가 중요한 개념이다.

### Action
사용자 또는 시스템이 발생시키는 도메인 이벤트다.

### State
도메인 관점에서 관찰 가능한 현재 조건이다.

### Transition
Action 또는 해석 규칙에 의해 한 State가 다른 State로 이동하는 규칙이다.

### Route
앱 계층이 인식하는 URL 진입점이다.

### UIArtifact
화면, 카드, 버튼, 진행 표시 등 시각적 조합 단위다.

### StaticResource
도메인이 사용하는 비행동성 콘텐츠 또는 정적 자원이다.

### ImplementationOwner
특정 개념의 주 구현 책임을 가지는 코드 위치다.

## 허용 관계 타입

도메인 문서에서는 아래 관계 동사만 사용한다. 새 관계가 필요하면 이 문서에 먼저 추가한다.

| 관계 | Source -> Target | 의미 |
| --- | --- | --- |
| `hasSubflow` | Domain -> Subflow | 도메인이 하위 워크플로를 포함한다. |
| `hasRoute` | Domain -> Route | 도메인이 진입 라우트를 가진다. |
| `collects` | Subflow/Domain -> ValueObject | 흐름이 사용자 입력 값을 수집한다. |
| `renders` | Domain/Subflow -> UIArtifact | 화면 경험 일부로 UIArtifact를 렌더링한다. |
| `uses` | Domain/Subflow/UIArtifact -> ValueObject/StaticResource | 다른 개념이나 정적 자원을 사용한다. |
| `transitionsTo` | State -> State | 합법적인 상태 전이다. |
| `triggeredBy` | Transition -> Action | 전이가 특정 Action에 의해 발생한다. |
| `ownedBy` | Concept -> ImplementationOwner | 구현 책임이 특정 코드 위치에 있다. |
| `dependsOn` | Concept -> Concept | 소유하지 않지만 의존한다. |
| `exposes` | ImplementationOwner -> UIArtifact/ValueObject/Action | public API로 외부에 노출한다. |
| `excludedFrom` | Concept -> Domain | 해당 도메인 범위에서 명시적으로 제외된다. |

## 구현 계층 매핑

| 계층 | 온톨로지 역할 |
| --- | --- |
| `app` | Route 진입점과 최상위 조합 경계 |
| `widgets` | UIArtifact 조합 소유자 |
| `features` | Action, State, Transition, UIArtifact 소유자 |
| `shared` | 도메인 간 재사용 StaticResource 또는 재사용 UIArtifact 소유자 |

## 구조 제약
- `ui` 파일은 상태 전이표, route 해석 규칙, 누적 상태 patch 규칙을 소유하면 안 된다.
- `widget` 본문 컴포넌트는 route 해석, 도메인 상태 누적, 전이 규칙, 화면 스위칭을 동시에 직접 소유하면 안 된다.
- `shared`는 도메인 전용 전이 규칙을 소유하면 안 된다.
- 하나의 도메인 개념은 하나의 주된 `ImplementationOwner`에 매핑되어야 한다.

## 온톨로지 출력 규칙
도메인 문서를 갱신할 때는 아래 원칙을 따른다.
- 설명문보다 표를 우선한다.
- invariant는 테스트 가능한 문장으로 적는다.
- 도메인 개념과 코드 소유권을 분리해서 적는다.
- alias 불일치는 반드시 명시한다.
