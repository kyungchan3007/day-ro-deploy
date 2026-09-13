# 도메인 온톨로지: Course

## Canonical Term
- `Course`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `course` | route/code | `/course/new` 전체 흐름 |
| `situation` | code path | 입력 단계 구현 경로 |
| `result` | query step | 추천 결과 단계 |
| `course-map` | code path | 확정 코스 지도/리스트 단계 구현 경로 |

## Domain Goal
- 사용자가 데이트 코스를 생성하기 위해 입력, 추천 확인, 확정 코스 확인까지 이어지는 전체 흐름을 수행할 수 있게 한다.
- 라우트는 하나지만 책임은 `SituationInput`, `CourseCandidateResult`, `CourseMapPreview` 세 하위 흐름으로 분리해 관리한다.

## 읽어야 하는 경우
- `/course/new` 전체 사용자 플로우를 이해해야 할 때
- 어떤 하위 문서를 먼저 읽어야 할지 판단해야 할 때
- 코스 생성 관련 라우트, 단계 경계, 전체 상태 전이를 검토할 때

## 먼저 읽을 하위 문서

| 수정 대상 | 먼저 읽을 문서 |
| --- | --- |
| 시간, 지역, 이동수단, 목적, route loading, step query | `course-situation.md` |
| 추천 결과 목록, 재추천, 선택완료 | `course-result.md` |
| 지도, 코스 순서, 저장 sheet, URL 기반 선택 복원 | `course-map.md` |

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/course/new` | Route | `src/app/course/new/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/course/new/page.tsx` |
| `widgets` | `src/widgets/situation/**`, `src/widgets/course-result/**`, `src/widgets/course-map/**` |
| `features` | `src/features/situation/**`, `src/features/course-result/**`, `src/features/course-map/**` |

## 사용자 플로우
1. 사용자가 `/course/new`에 진입한다.
2. `SituationInput`에서 조건을 입력한다.
3. `CourseCandidateResult`에서 추천 후보를 고르고 재추천 또는 선택완료를 수행한다.
4. `CourseMapPreview`에서 URL query로 전달된 확정 코스를 지도와 리스트로 확인한다.
5. 로그인 사용자는 확정 코스를 저장할 수 있다.

## Subflows

| Subflow | 목적 | 문서 |
| --- | --- | --- |
| `SituationInput` | 코스 생성 조건 수집 | `course-situation.md` |
| `CourseCandidateResult` | 추천 결과 선택 및 재추천 | `course-result.md` |
| `CourseMapPreview` | 확정 코스 확인 및 저장 준비 | `course-map.md` |

## States

| State | 의미 |
| --- | --- |
| `CourseEntry` | `/course/new` 진입 직후 상태 |
| `SituationInput` | 입력 단계 진행 중 상태 |
| `CourseCandidateResult` | 추천 후보 선택 상태 |
| `CourseMapPreview` | 확정 코스 확인 상태 |

## Top-level Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| `CourseEntry` | `ResolveSituationStepFromQuery` | `SituationInput` | 입력 단계 또는 후속 결과/지도 단계 진입 |
| `SituationInput` | `StartCourseGeneration` | `CourseCandidateResult` | URL query 확정 후 서버가 추천 후보를 준비하고 결과 상태로 진입 |
| `CourseCandidateResult` | `ConfirmCourseSelection` | `CourseMapPreview` | 최소 선택 개수 충족 후 확정 코스 진입 |
| `CourseMapPreview` | `ReturnToCandidates` | `CourseCandidateResult` | 결과 화면 복귀 |

## Invariants
- `Course`는 단일 라우트이지만 세 하위 흐름의 책임을 한 파일에 뭉치지 않는다.
- 입력 단계, 결과 단계, 지도 단계의 규칙은 각각 해당 하위 문서와 소유 경로에서 관리한다.
- `widget` 파일이 step 계산, 재추천 라우팅, SDK 접근, URL 직렬화를 동시에 소유하면 안 된다.
- 초기 렌더에 필요한 기준 데이터는 `SituationInput` 기준으로 SSR 우선 검토한다.
- `result/course` 단계 데이터는 URL query를 서버가 읽어 준비한 값과 일치해야 한다.

## UI 계약
- `/course/new`는 단계형 흐름이라는 사실을 사용자에게 명확히 전달해야 한다.
- 단계별 CTA와 진행 상태는 현재 하위 흐름 문맥과 일치해야 한다.
- 공용 progress, button, layout, dialog primitive 가 있으면 먼저 재사용 가능 여부를 검토한다.

## SSR / BFF / 데이터 규칙
- 초기 기준 데이터는 `SituationInput` 문서 기준을 따른다.
- 추천 결과 재요청은 `CourseCandidateResult` 문서 기준을 따른다.
- 지도 SDK와 URL 기반 선택 복원은 `CourseMapPreview` 문서 기준을 따른다.
- 코스 저장 요청은 로그인 세션을 전제로 BFF `/api/courses`를 통해 수행한다.
- `/course/new/loading.tsx`는 후속 결과/지도 단계 데이터를 서버가 준비하는 동안 공통 로딩 경험을 제공한다.
- 외부 백엔드 API 직접 호출은 금지하고 BFF 또는 서버 계층을 사용한다.

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| 라우트 entry | `src/app/course/new/page.tsx` |
| 입력 단계 | `src/widgets/situation/**`, `src/features/situation/**` |
| 결과 단계 | `src/widgets/course-result/**`, `src/features/course-result/**` |
| 지도 단계 | `src/widgets/course-map/**`, `src/features/course-map/**` |

## Out Of Scope
- 추천 알고리즘 자체
- 외부 내비게이션 앱 연동
- 실시간 동기화

## 테스트 포인트
- 전체 플로우 e2e는 입력 -> 결과 -> 지도 진입의 상위 연결만 검증한다.
- 세부 규칙 테스트는 각 하위 문서 기준으로 분리한다.
- `/course/new` 관련 실패는 어느 하위 흐름 문제인지 먼저 분류하고 해당 문서를 다시 읽는다.

## Validation Rules
- `Course` 상위 문서는 전체 경계와 읽기 순서를 설명하는 개요 문서로 유지한다.
- 세부 상태 전이, view-model 규칙, 저장소/SDK 정책은 하위 문서로 내린다.
- 구현 또는 검증 전에 수정 범위에 맞는 하위 문서를 읽지 않았다면 작업을 진행하지 않는다.
