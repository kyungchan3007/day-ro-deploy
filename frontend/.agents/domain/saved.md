# 도메인 온톨로지: Saved

## Canonical Term
- `Saved`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `saved` | route/code | `/saved`, `src/features/saved`, `src/widgets/saved` |
| `saved courses` | UI label | 홈에서 "찜한 코스"로 노출되는 분기 |

## Domain Goal
- 사용자가 저장해 둔 데이트 코스 목록을 확인할 수 있는 진입 화면을 제공한다.
- 저장 코스 목록을 읽기 전용으로 노출하고, 상세/수정/삭제 같은 후속 흐름은 분리한다.

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/saved` | Route | `src/app/saved/page.tsx` |

## Subflows
- 현재 모델링된 하위 흐름 없음

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | 설명 |
| --- | --- | --- |
| `SavedCourseItem` | `id`, `name`, `desc`, `meta`, `date` | 찜한 코스 목록 한 행에 필요한 표시 데이터 |
| `SavedCourseMeta` | string | `"5곳 · 종로구"` 같은 요약 메타 문자열 |
| `SavedCourseDateLabel` | string | `"2026.07.01 저장"` 같은 저장일 라벨 |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `OpenSavedCourses` | 사용자가 홈에서 찜한 코스 카드를 클릭 | `Saved` 도메인 진입 |
| `OpenSavedCourseDetail` | 사용자가 목록 카드를 클릭 | 저장 코스 상세 분기 진입 |

## States

| State | 의미 |
| --- | --- |
| `SavedListReady` | 저장 코스 목록이 렌더된 상태 |
| `SavedListEmpty` | 저장 코스가 없어 빈 상태 문구가 렌더된 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| 외부 진입 | `OpenSavedCourses` | `SavedListReady` | 저장 코스 데이터가 있을 때 |
| 외부 진입 | `OpenSavedCourses` | `SavedListEmpty` | 저장 코스 데이터가 없을 때 |
| `SavedListReady` | `OpenSavedCourseDetail` | 외부 저장 코스 상세 상태 | 상세 라우트/도메인이 소유 |

## Invariants
- `Saved`는 목록 조회/진입만 소유하고 저장 코스 상세 로직은 소유하지 않는다.
- `SavedListScreen`은 목록 조합만 담당하고 데이터 fetch 규칙이나 상세 도메인 전이를 직접 소유하지 않는다.
- 빈 상태와 목록 상태는 동시에 렌더되면 안 된다.
- 목록 카드는 동일한 표시 계약(`name`, `desc`, `meta`, `date`)으로 렌더되어야 한다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `SavedListScreen` | UIArtifact | `src/widgets/saved/SavedListScreen.tsx` |
| `SavedCourseCard` | UIArtifact | `src/features/saved/ui/SavedCourseCard.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `Saved` route entry | `src/app/saved/page.tsx` |
| `SavedListScreen` 조합 | `src/widgets/saved/SavedListScreen.tsx` |
| `SavedCourseCard` public API | `src/features/saved/index.ts` |
| `Saved` 정적 목록 데이터 | `src/shared/static/saved` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Saved` | `hasRoute` | `/saved` |
| `Saved` | `renders` | `SavedListScreen` |
| `SavedListScreen` | `renders` | `SavedCourseCard` |
| `Saved` | `uses` | `shared/static/saved` |
| `OpenSavedCourses` | `dependsOn` | `Home` |
| `OpenSavedCourseDetail` | `dependsOn` | 저장 코스 상세 도메인 |

## Out Of Scope
- 저장 코스 상세 화면
- 저장 코스 수정/삭제
- 로그인 기반 필터링
- 백엔드 저장 코스 API 연동

## Validation Rules
- `SavedListScreen`은 조합 아티팩트로 유지되어야 한다.
- `SavedCourseCard`는 표시용 계약을 벗어난 상세 비즈니스 규칙을 소유하면 안 된다.
- 상세 라우트가 추가되면 구현 전에 `OpenSavedCourseDetail`의 상태/전이를 먼저 구체화해야 한다.
