# 도메인 온톨로지: Course

## Canonical Term
- `Course`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `course` | route/code | `/course/new` |
| `situation` | code path | `src/features/situation`, `src/widgets/situation` |
| `SituationInput` | subflow term | 현재 step 흐름의 canonical term |

## Domain Goal
- 코스 생성을 위해 필요한 최소 입력값을 수집한다.
- 사용자를 코스 생성 진입 상태에서 추천 생성 준비 상태로 이동시킨다.

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/course/new` | Route | `src/app/course/new/page.tsx` |

## Subflows

| Subflow | 목적 | Owner |
| --- | --- | --- |
| `SituationInput` | 코스 생성 전 시간, 지역, 이동수단, 목적을 수집 | `src/widgets/situation`, `src/features/situation` |

## Entities

| 용어 | 상태 | 설명 |
| --- | --- | --- |
| `CourseRequest` | 개념 수준 | 아직 `entities`로 분리되진 않았지만, 코스 생성 요청의 상위 집계 개념 |

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `Time` | `meridiem`, `hour`, `minute` | `src/features/situation/model/types.ts` |
| `TimeRange` | `start`, `end` | `src/features/situation/model/types.ts` |
| `RegionArea` | `id`, `label` | `src/features/situation/model/types.ts` |
| `RegionGroup` | `id`, `label`, `areas` | `src/features/situation/model/types.ts` |
| `TransportSelection` | `go`, `local` | `src/features/situation/model/types.ts` |
| `PurposeChoice` | 문자열 집합 | `src/features/situation/model/types.ts` |
| `SituationAnswers` | `time`, `region`, `transport`, `purpose` | `src/features/situation/model/types.ts` |
| `SituationStepKey` | `time | region | transport | purpose` | `src/features/situation/model/flow.ts` |
| `SituationFlowStep` | `SituationStepKey | loading` | `src/features/situation/model/flow.ts` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `SelectTimeRange` | 사용자가 시간 step 완료 | `SituationAnswers.time` 갱신 |
| `SelectRegion` | 사용자가 지역 step 완료 | `SituationAnswers.region` 갱신 |
| `SelectTransport` | 사용자가 이동수단 step 완료 | `SituationAnswers.transport` 갱신 |
| `SelectPurpose` | 사용자가 목적 step 완료 | `SituationAnswers.purpose` 갱신 |
| `AdvanceSituationStep` | 유효 입력 후 시스템 규칙 실행 | 다음 step 이동 |
| `GoBackSituationStep` | 사용자가 뒤로가기 클릭 | 이전 step 또는 브라우저 back |
| `ResolveSituationStepFromQuery` | route query 해석 | 현재 step 결정 |
| `StartCourseGeneration` | 목적 step 완료 | loading 상태 진입 |

## States

| State | 의미 |
| --- | --- |
| `CourseEntry` | 라우트에 진입했지만 step 흐름이 아직 해석되지 않은 상태 |
| `SituationTime` | 시간 step이 보이는 상태 |
| `SituationRegion` | 지역 step이 보이는 상태 |
| `SituationTransport` | 이동수단 step이 보이는 상태 |
| `SituationPurpose` | 목적 step이 보이는 상태 |
| `CourseGenerationLoading` | 추천 생성 준비/로딩 화면이 보이는 상태 |

## Transitions

| From | Action | To | 제약 |
| --- | --- | --- | --- |
| `CourseEntry` | `ResolveSituationStepFromQuery` | `SituationTime` | query가 없거나 유효하지 않으면 기본값 |
| `CourseEntry` | `ResolveSituationStepFromQuery` | `SituationRegion` | query가 `region`일 때만 |
| `CourseEntry` | `ResolveSituationStepFromQuery` | `SituationTransport` | query가 `transport`일 때만 |
| `CourseEntry` | `ResolveSituationStepFromQuery` | `SituationPurpose` | query가 `purpose`일 때만 |
| `CourseEntry` | `ResolveSituationStepFromQuery` | `CourseGenerationLoading` | query가 `loading`일 때만 |
| `SituationTime` | `SelectTimeRange` + `AdvanceSituationStep` | `SituationRegion` | 유효한 시간 범위 필요 |
| `SituationRegion` | `SelectRegion` + `AdvanceSituationStep` | `SituationTransport` | 지역 선택 필요 |
| `SituationTransport` | `SelectTransport` + `AdvanceSituationStep` | `SituationPurpose` | 두 이동수단 값 모두 필요 |
| `SituationPurpose` | `SelectPurpose` + `StartCourseGeneration` | `CourseGenerationLoading` | 목적 선택 필요 |

## Invariants
- `SituationInput`의 step 순서는 고정이다: `time -> region -> transport -> purpose -> loading`.
- `SituationAnswers`는 하위 흐름 전체에서 누적된다.
- `SituationFlow`는 step registry와 patch 규칙을 직접 소유하면 안 된다.
- URL query에서 step을 해석하는 규칙은 screen UI가 아니라 feature model과 controller/hook이 소유해야 한다.
- `CourseGenerationLoading`은 progress step 집계에서 제외된다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `SituationFlow` | UIArtifact | `src/widgets/situation/SituationFlow.tsx` |
| `SituationTimeScreen` | UIArtifact | `src/widgets/situation/SituationTimeScreen.tsx` |
| `SituationRegionScreen` | UIArtifact | `src/widgets/situation/SituationRegionScreen.tsx` |
| `SituationTransportScreen` | UIArtifact | `src/widgets/situation/SituationTransportScreen.tsx` |
| `SituationPurposeScreen` | UIArtifact | `src/widgets/situation/SituationPurposeScreen.tsx` |
| `SituationLoadingScreen` | UIArtifact | `src/widgets/situation/SituationLoadingScreen.tsx` |
| `TimeRangeField` | UIArtifact | `src/features/situation/ui/TimeRangeField.tsx` |
| `TimeWheel` | UIArtifact | `src/features/situation/ui/TimeWheel.tsx` |
| `RegionGroupChips` | UIArtifact | `src/features/situation/ui/RegionPicker.tsx` |
| `RegionAreaChips` | UIArtifact | `src/features/situation/ui/RegionPicker.tsx` |
| `TransportCardGroup` | UIArtifact | `src/features/situation/ui/TransportCardGroup.tsx` |
| `PurposeOptionGrid` | UIArtifact | `src/features/situation/ui/PurposeOptionGrid.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `Course` route entry | `src/app/course/new/page.tsx` |
| `SituationInput` 조합 | `src/widgets/situation/SituationFlow.tsx` |
| `SituationInput` route orchestration | `src/widgets/situation/hooks/useSituationFlowController.ts` |
| `SituationInput` transition model | `src/features/situation/model/flow.ts` |
| `SituationInput` value objects | `src/features/situation/model/types.ts` |
| `SituationInput` step hooks | `src/features/situation/hooks/*` |
| `SituationInput` public API | `src/features/situation/index.ts` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Course` | `hasRoute` | `/course/new` |
| `Course` | `hasSubflow` | `SituationInput` |
| `SituationInput` | `collects` | `TimeRange` |
| `SituationInput` | `collects` | `RegionArea` |
| `SituationInput` | `collects` | `TransportSelection` |
| `SituationInput` | `collects` | `PurposeChoice` |
| `SituationInput` | `uses` | `SituationAnswers` |
| `SituationInput` | `renders` | `SituationFlow` |
| `SituationFlow` | `dependsOn` | `useSituationFlowController` |
| `useSituationFlowController` | `dependsOn` | `resolveSituationStep` |
| `useSituationFlowController` | `dependsOn` | `patchSituationAnswers` |

## Out Of Scope
- 추천 알고리즘 실행
- 코스 결과 렌더링
- 저장/찜 동작
- 백엔드 API 연동
- 실시간 진행률 동기화

## Validation Rules
- `SituationFlow`는 step screen을 고르는 얇은 switcher로 유지되어야 한다.
- step registry, 이전/다음 계산, answers patch 규칙은 widget 본문 UI 바깥에 있어야 한다.
- `loading` 이후의 새로운 코스 생성 단계를 추가하려면 먼저 새로운 state와 transition을 정의해야 한다.
- `CourseRequest`가 안정적인 공유 개념이 되면 `SituationAnswers`에서 암묵적으로 추론하지 말고 명시적으로 승격해야 한다.
