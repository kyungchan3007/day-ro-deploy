# 도메인 온톨로지: Home

## Canonical Term
- `Home`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `home` | code path | `src/features/home`, `src/widgets/home` |
| `root` | route role | 앱 루트 라우트 `/` |

## Domain Goal
- 앱 진입 직후 사용자가 선택할 수 있는 첫 행동 허브를 제공한다.
- 하위 도메인 로직을 끌어들이지 않고 다음 주요 경로를 선택하게 한다.

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/` | Route | `src/app/page.tsx` |

## Subflows
- 없음

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | 설명 |
| --- | --- | --- |
| `HomeEntry` | `title`, `subtitle`, `href`, `illustration` | 홈 화면에서 렌더링되는 진입 카드 데이터 |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `SelectCreateCourseEntry` | 사용자가 생성 카드 클릭 | `Course` 도메인 진입 |
| `SelectSavedCourseEntry` | 사용자가 저장 코스 카드 클릭 | 저장 코스 분기 진입 |

## States

| State | 의미 |
| --- | --- |
| `HomeIdle` | 홈 카드가 노출되고 사용자의 선택을 기다리는 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| `HomeIdle` | `SelectCreateCourseEntry` | 외부 `Course` 진입 상태 | 라우트 handoff만 수행 |
| `HomeIdle` | `SelectSavedCourseEntry` | 외부 저장 코스 진입 상태 | 라우트 handoff만 수행 |

## Invariants
- `Home`는 경로 선택만 소유하고 하위 도메인 비즈니스 규칙은 소유하지 않는다.
- `Home`에는 로그인/세션 분기 로직이 들어가면 안 된다.
- `Home`에는 코스 생성 상태가 들어가면 안 된다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `HomeScreen` | UIArtifact | `src/widgets/home/HomeScreen.tsx` |
| `HomeEntryCard` | UIArtifact | `src/features/home/ui/HomeEntryCard.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `Home` route entry | `src/app/page.tsx` |
| `HomeScreen` 조합 | `src/widgets/home/HomeScreen.tsx` |
| `HomeEntryCard` public API | `src/features/home/index.ts` |
| `Home` 정적 카피 | `src/shared/static/home` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Home` | `hasRoute` | `/` |
| `Home` | `renders` | `HomeScreen` |
| `HomeScreen` | `renders` | `HomeEntryCard` |
| `Home` | `uses` | `shared/static/home` |
| `SelectCreateCourseEntry` | `dependsOn` | `Course` |
| `SelectSavedCourseEntry` | `dependsOn` | 저장 코스 분기 |

## Out Of Scope
- 코스 생성 자체
- 저장 코스 상세 동작
- 인증 정책
- 추천 계산 로직

## Validation Rules
- `HomeScreen`은 조합 아티팩트로 유지되어야 한다.
- `HomeEntryCard`는 네비게이션 affordance를 렌더링할 수 있지만 교차 도메인 상태를 소유하면 안 된다.
- 향후 홈에서 로그인/세션 분기를 추가하려면 구현 전에 도메인 모델을 먼저 갱신해야 한다.
