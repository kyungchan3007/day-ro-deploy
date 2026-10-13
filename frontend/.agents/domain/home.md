# 도메인 온톨로지: Home

## Canonical Term
- `Home`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `home` | code path | `src/features/home`, `src/widgets/home` |
| `root` | route role | 앱 루트 라우트 `/` |

## Domain Goal
- 앱 진입 직후 사용자가 다음 주요 행동을 선택할 수 있는 첫 허브를 제공한다.
- 하위 도메인 규칙을 끌어오지 않고 경로 handoff만 소유한다.

## 읽어야 하는 경우
- `src/app/page.tsx`, `src/widgets/home/**`, `src/features/home/**`, `src/shared/static/home/**`를 수정할 때
- 홈 진입 카드, 홈 레이아웃, 홈에서 다른 도메인으로 이동하는 링크를 수정할 때
- 홈 화면 테스트나 접근성 계약을 추가할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/` | Route | `src/app/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/page.tsx` |
| `widgets` | `src/widgets/home/**` |
| `features` | `src/features/home/**` |
| `shared/static` | `src/shared/static/home/**` |
| `shared/ui` | `AppShell`, `NavBar` 등 홈에서 재사용하는 공용 primitive |

## 사용자 플로우
1. 사용자가 앱 루트 `/`에 진입한다.
2. 홈 진입 카드 목록을 본다.
3. 코스 생성 또는 찜한 코스 목록으로 이동한다.

## Subflows
- 없음

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `HomeEntry` | `title`, `subtitle`, `href`, `illustration` | `src/shared/static/home/index.ts` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `SelectCreateCourseEntry` | 사용자가 생성 카드 클릭 | `Course` 도메인 진입 |
| `SelectSavedCourseEntry` | 사용자가 찜한 코스 카드 클릭 | `Saved` 도메인 진입 |

## States

| State | 의미 |
| --- | --- |
| `HomeIdle` | 홈 카드가 노출되고 사용자의 선택을 기다리는 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| `HomeIdle` | `SelectCreateCourseEntry` | 외부 `Course` 진입 상태 | 라우트 handoff만 수행 |
| `HomeIdle` | `SelectSavedCourseEntry` | 외부 `Saved` 진입 상태 | 라우트 handoff만 수행 |

## Invariants
- `Home`는 경로 선택만 소유하고 하위 도메인 비즈니스 규칙은 소유하지 않는다.
- `Home`에는 로그인/세션 분기 로직이 들어가면 안 된다.
- `Home`에는 코스 생성 상태나 저장 코스 목록 상태가 들어가면 안 된다.
- 홈 카드 href 는 정적 라우트 계약과 일치해야 한다.

## UI 계약
- 홈은 진입 카드 중심 화면이어야 한다.
- 카드 이름과 설명은 정적 카피와 일치해야 한다.
- 홈 카드가 링크 역할을 가지면 클릭 가능한 `div` 대신 링크 또는 링크 기반 컴포넌트를 사용해야 한다.
- 공용 레이아웃 primitive 가 있으면 이를 우선 검토한다.

## SSR / BFF / 데이터 규칙
- 홈 카피와 카드 정보는 정적 리소스로 렌더한다.
- 홈은 초기 렌더를 위해 별도 BFF 호출을 요구하지 않는다.
- 홈에 세션/사용자 상태를 직접 넣으려면 먼저 도메인 모델을 갱신해야 한다.

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
| `Home` 정적 카피 | `src/shared/static/home/index.ts` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Home` | `hasRoute` | `/` |
| `Home` | `renders` | `HomeScreen` |
| `HomeScreen` | `renders` | `HomeEntryCard` |
| `Home` | `uses` | `src/shared/static/home` |
| `SelectCreateCourseEntry` | `dependsOn` | `Course` |
| `SelectSavedCourseEntry` | `dependsOn` | `Saved` |

## Out Of Scope
- 코스 생성 자체
- 찜한 코스 목록/상세 로직
- 인증 정책
- 추천 계산 로직

## 테스트 포인트
- 홈 카드 href 가 `/course/new`, `/saved`를 유지하는지 확인한다.
- 카드 카피가 의도치 않게 합쳐지거나 줄바꿈이 사라지지 않는지 확인한다.
- 역할 기반 선택자로 홈 진입 링크를 검증한다.

## Validation Rules
- `HomeScreen`은 조합 아티팩트로 유지되어야 한다.
- `HomeEntryCard`는 네비게이션 affordance를 렌더할 수 있지만 교차 도메인 상태를 소유하면 안 된다.
- 홈에서 로그인/세션 분기를 추가하려면 구현 전에 도메인 모델을 먼저 갱신해야 한다.
