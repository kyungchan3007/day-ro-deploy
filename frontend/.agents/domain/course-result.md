# 도메인 온톨로지: Course > CourseCandidateResult

## Canonical Term
- `CourseCandidateResult`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `course-result` | code path | `src/features/course-result`, `src/widgets/course-result` |
| `result` | query step | `/course/new?step=result` |

## Domain Goal
- 추천된 장소 후보를 보여주고 사용자가 코스 확정 전 선택과 재추천을 수행할 수 있게 한다.

## 읽어야 하는 경우
- `src/widgets/course-result/**`, `src/features/course-result/**`를 수정할 때
- 선택완료 규칙, 재추천, 흐름 상태(rev) 기반 후보 복원, 결과 CTA를 수정할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/course/new?step=result` | Route 상태 | `src/widgets/course-result/CourseResultScreen.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `widgets` | `src/widgets/course-result/**` |
| `features` | `src/features/course-result/**` |
| `shared/ui` | 카드, 버튼, 배지 등 결과 화면에서 재사용하는 공용 primitive |

## 사용자 플로우
1. 추천 생성이 끝나면 후보 결과 화면이 열린다.
2. 사용자가 후보를 선택하거나 다른 코스 보기를 요청한다.
3. 최소 선택 개수를 채우면 코스 확정으로 이동한다.

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `ShowCourseCandidates` | 추천 응답 완료 | 후보 목록 노출 |
| `ToggleCourseCandidateSelection` | 장소 항목 클릭 | 선택 상태/순서 갱신 |
| `RequestMoreCourseCandidates` | 다른 코스 보기 클릭 | 추천 재요청 |
| `ConfirmCourseSelection` | 선택완료 클릭 | 확정 코스 화면으로 이동 |

## States

| State | 의미 |
| --- | --- |
| `CourseCandidateResultIdle` | 후보 목록이 보이는 상태 |
| `CourseCandidateResultRefreshing` | 재추천 요청 중인 상태 |
| `CourseCandidateSelectionReady` | 최소 선택 개수를 채운 상태 |

## Invariants
- 결과 화면은 추천 후보가 있어야 렌더된다.
- 선택완료는 최소 선택 개수를 충족하기 전에는 활성화되면 안 된다.
- 재추천은 loading 스냅샷의 retry operation 으로만 시작하고, 새 후보는 result 스냅샷(rev)으로 기록한다(issue #129).
- 재추천 loading 스냅샷에는 직전 후보를 함께 기록한다. 재추천이 실패·중단되면 같은 requestId·후보의 result 스냅샷으로 되돌리고 "다른 코스를 불러오지 못했어요" 안내를 띄운다. 백엔드는 실패한 재추천을 차감하지 않으므로 남은 횟수도 유지된다(issue #143).
- 최초 생성 실패·중단만 purpose 로 되돌린다(재추천 실패를 purpose 로 보내면 새 코스 생성으로 남은 횟수가 초기화된다).
- 후보 데이터는 흐름 상태(`features/situation/model/course-flow`, sessionStorage 영속화)의 rev 스냅샷에서 복원한다. 주소에는 step·rev 만 둔다(issue #129, ADR-26).

## UI 계약
- 후보 목록은 사용자 선택 상태를 시각적으로 구분해야 한다.
- 선택 순서가 중요하면 순서를 사용자에게 전달해야 한다.
- 재추천 CTA와 선택완료 CTA는 동시에 의미가 충돌하지 않아야 한다.

## SSR / BFF / 데이터 규칙
- 추천 결과는 초기 렌더 데이터가 아니라 사용자 입력 완료 이후 데이터다.
- 재추천은 사용자 상호작용 이후에만 발생해야 하며, 페이지 조회·복원은 생성·재추천을 실행하지 않는다.
- 외부 백엔드 API 직접 호출은 금지한다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `CourseResultScreen` | UIArtifact | `src/widgets/course-result/CourseResultScreen.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| 선택 상태 hook | `src/features/course-result/hooks/useCourseSelection.ts` |
| 결과 화면 hook | `src/features/course-result/hooks/useCourseResult.ts` |
| 선택 model | `src/features/course-result/model/course-selection.ts` |
| 결과 route 재준비 | `src/widgets/situation/hooks/useSituationFlowController.ts` |

## Out Of Scope
- 지도 렌더링
- 저장 sheet 입력
- 최종 저장 API

## 테스트 포인트
- 최소 선택 개수 규칙을 검증한다.
- 재추천 시 새 rev 스냅샷이 기록되고 주소에 requestId·후보가 없는지 검증한다.
- 선택완료 활성화/비활성화를 검증한다.

## Validation Rules
- 결과 화면에서 재추천, 선택 규칙, 흐름 상태 기록/주소 직렬화를 widget 본문이 직접 소유하면 안 된다.
- `다른 코스 보기`는 단순 화면 변화가 아니라 실제 재요청 시점을 검증해야 한다.
