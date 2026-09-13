# 도메인 온톨로지: Course > SituationInput

## Canonical Term
- `SituationInput`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `situation` | code path | `src/features/situation`, `src/widgets/situation` |
| `course/new steps` | UI/flow | `/course/new`의 입력 단계 흐름 |

## Domain Goal
- 코스 생성을 위해 필요한 최소 입력값을 단계적으로 수집한다.
- 유효한 입력만 URL query 상태로 올리고, 최종적으로 서버가 추천 결과를 준비할 수 있는 상태까지 이동시킨다.

## 읽어야 하는 경우
- `src/widgets/situation/**`, `src/features/situation/**`, `src/app/course/new/page.tsx`를 수정할 때
- 시간, 지역, 목적, 진행 상태, step query 해석을 수정할 때
- `/course/new` 초기 렌더와 관련된 SSR/BFF 판단을 할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/course/new` | Route | `src/app/course/new/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/course/new/page.tsx` |
| `widgets` | `src/widgets/situation/**` |
| `features` | `src/features/situation/**` |
| `shared/ui` | `StepProgress`, `Button`, `AppShell`, `NavBar` 등 재사용 primitive |

## 사용자 플로우
1. 사용자가 `/course/new`에 진입한다.
2. 시간, 지역, 목적을 순서대로 입력한다.
3. 지역 단계에서는 검색 입력창이 기본으로 열리고, 검색어가 비어 있으면 인기 검색어 칩이 먼저 노출된다.
4. 사용자가 인기 검색어 칩을 누르거나, 소분류 표시명(`name`) 또는 행정동(`dong`)으로 직접 검색할 수 있다.
5. 인기 검색어 칩을 누르면 해당 자치구 그룹이 자동으로 활성화되고, 추천 요청에 필요한 `districtId`가 즉시 선택된다.
6. 지역 검색 결과를 선택하면 해당 자치구 그룹이 자동으로 활성화되고, 추천 요청에 필요한 `districtId`가 함께 결정된다.
7. 목적 step 완료 시 URL query가 갱신되고, 서버가 추천 결과를 준비하는 동안 route-level loading 이 표시된다.

## Subflows
- 없음

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `TimeRange` | `start`, `end` | `src/features/situation/model/types.ts` |
| `RegionGroup` | `id`, `label`, `areas` | `src/features/situation/model/types.ts` |
| `RegionArea` | `id`, `label`, `dong` | `src/features/situation/model/types.ts` |
| `RegionSearchMatch` | `groupId`, `groupLabel`, `area` | `src/features/situation/model/types.ts` |
| `PurposeChoice` | 문자열 집합 | `src/features/situation/model/types.ts` |
| `SituationAnswers` | `time`, `region`, `purpose` | `src/features/situation/model/types.ts` |
| `SituationStepKey` | `time | region | purpose` | `src/features/situation/model/flow.ts` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `ResolveSituationStepFromQuery` | 라우트 진입 또는 query 변경 | 현재 step 결정 |
| `SelectTimeRange` | 시간 step 완료 | 시간 값 갱신 |
| `SelectRegion` | 지역 step 완료 | 지역 값 갱신 |
| `SearchRegion` | 지역 검색어 입력 | `name`/`dong` 기준 후보 목록 필터링 |
| `ApplyPopularRegionKeyword` | 인기 검색어 칩 클릭 | canonical 지역 값 즉시 선택 + CTA 활성화 |
| `SelectRegionFromSearch` | 지역 검색 결과 선택 | 자치구 그룹 자동 활성화 + 지역 값 갱신 |
| `SelectPurpose` | 목적 step 완료 | 목적 값 갱신 |
| `AdvanceSituationStep` | 유효 입력 후 다음 이동 | 다음 step 이동 |
| `GoBackSituationStep` | 뒤로가기 | 이전 step 또는 라우트 back |
| `StartCourseGeneration` | 목적 step 완료 | URL query 확정 및 서버 추천 준비 시작 |

## States

| State | 의미 |
| --- | --- |
| `SituationTime` | 시간 step 상태 |
| `SituationRegion` | 지역 step 상태 |
| `SituationPurpose` | 목적 step 상태 |
| `CourseGenerationLoading` | 서버 추천 준비 중 route-level 로딩 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| 외부 진입 | `ResolveSituationStepFromQuery` | `SituationTime` | query 기본값 또는 `time` |
| `SituationTime` | `SelectTimeRange` + `AdvanceSituationStep` | `SituationRegion` | 유효한 시간 범위 필요 |
| `SituationRegion` | `SelectRegion` 또는 `SelectRegionFromSearch` + `AdvanceSituationStep` | `SituationPurpose` | 지역 선택 필요. 검색 선택이면 자치구 그룹도 함께 고정된다. |
| `SituationPurpose` | `SelectPurpose` + `StartCourseGeneration` | `CourseGenerationLoading` | 목적 선택 후 URL query 확정 |

## Invariants
- step 순서는 고정이다: `time -> region -> purpose -> loading`.
- `SituationAnswers`는 URL query와 서버 page가 함께 해석할 수 있는 형태로 유지된다.
- 시간 선택은 최소 2시간, 최대 12시간 제약을 가진다.
- 지역 검색은 소분류 표시명(`name`)과 행정동(`dong`)을 모두 같은 엔트리로 매칭해야 한다.
- 지역 검색 또는 칩 선택으로 확정된 지역 값은 최소한 `districtId`, 표시명(`label`), 자치구(`category`)를 복원할 수 있어야 한다.
- step registry, next/back 계산, answers patch 규칙은 widget 본문이 아니라 hook/model 이 소유해야 한다.
- 초기 지역 데이터는 SSR 또는 Server Component 준비를 우선 검토한다.
- 클라이언트 메모리나 `sessionStorage` 없이도 URL query만으로 현재 입력 상태를 복원할 수 있어야 한다.

## UI 계약
- 단계형 UI는 현재 step과 총 step을 사용자에게 알려야 한다.
- 지역 선택은 그룹/세부 지역 구조를 유지해야 한다.
- 빈 검색어 상태에서는 인기 검색어 칩이 기본으로 노출되어야 한다.
- 지역 검색 UI를 붙이더라도 검색 결과 선택은 기존 지역 선택과 같은 도메인 값으로 정규화되어야 한다.
- 인기 검색어 칩 클릭은 canonical 지역 값으로 즉시 선택되어야 한다.
- 지역 검색 결과를 선택하면 해당 자치구 그룹이 자동으로 반영되어야 한다.
- 버튼 라벨은 현재 step 문맥과 일치해야 한다.
- 기존 공용 progress, button, layout primitive 재사용 가능 여부를 먼저 검토해야 한다.

## SSR / BFF / 데이터 규칙
- 지역 목록은 초기 렌더에 필요하므로 서버 준비가 기본값이다.
- 인기 검색어도 region step 초기 상태에 필요하므로 서버 준비가 기본값이다.
- `getInitialRegionGroups`에서 서버 데이터를 view-model 로 변환한다.
- 지역 서버 계약은 백엔드 `RegionResponse.RegionItem(name, dong, districtIds)`와 일치해야 한다.
- 클라이언트에서 외부 백엔드 API를 직접 호출하지 않는다.
- 추천 결과 준비는 입력 완료 이후 서버 page가 수행한다.
- `loading.tsx`는 추천 결과 준비 동안 공통 로딩 화면을 제공한다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `SituationFlow` | UIArtifact | `src/widgets/situation/SituationFlow.tsx` |
| `SituationTimeScreen` | UIArtifact | `src/widgets/situation/SituationTimeScreen.tsx` |
| `SituationRegionScreen` | UIArtifact | `src/widgets/situation/SituationRegionScreen.tsx` |
| `SituationPurposeScreen` | UIArtifact | `src/widgets/situation/SituationPurposeScreen.tsx` |
| `SituationLoadingScreen` | UIArtifact | `src/widgets/situation/SituationLoadingScreen.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| 라우트 진입 | `src/app/course/new/page.tsx` |
| step orchestration | `src/widgets/situation/hooks/useSituationFlowController.ts` |
| step model | `src/features/situation/model/flow.ts` |
| URL query parse/serialize | `src/features/situation/model/url-state.ts` |
| region search model | `src/features/situation/model/region-search.ts` |
| request model | `src/features/situation/model/request.ts` |
| server bootstrap | `src/features/situation/server/get-initial-region-groups.ts` |
| route-level page data prepare | `src/features/situation/server/get-course-new-page-data.ts` |

## Out Of Scope
- 추천 결과 선택
- 확정 코스 지도 화면
- 저장 API 연동

## 테스트 포인트
- step query 해석과 step 이동 규칙을 검증한다.
- URL query 직렬화/복원 규칙을 검증한다.
- 지역 데이터 서버 계약과 초기 렌더 준비를 검증한다.
- 지역 검색이 `name` 과 `dong` 양쪽 입력에서 같은 자치구/`districtId` 매칭을 복원하는지 검증한다.
- `/course/new`에서 입력 완료 후에만 서버 추천 준비가 시작되는지 확인한다.

## Validation Rules
- `SituationFlow`는 step 화면을 조합하는 얇은 switcher 여야 한다.
- URL query 해석과 step 이동 규칙이 `widget` 본문에 직접 들어가면 구조 위반 후보로 본다.
- 초기 렌더에 필요한 기준 데이터를 클라이언트 fetch로 내리기 전에 SSR 가능성을 먼저 검토해야 한다.
