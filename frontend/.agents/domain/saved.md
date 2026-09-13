# 도메인 온톨로지: Saved

## Canonical Term
- `Saved`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `saved` | route/code | `/saved`, `src/features/saved`, `src/widgets/saved` |
| `saved courses` | UI label | 홈에서 "찜한 코스"로 노출되는 분기 |

## Domain Goal
- 사용자가 저장해 둔 데이트 코스 목록을 확인하고, 목록에서 개별 코스를 삭제할 수 있는 진입 화면을 제공한다.
- 목록 조회와 목록에서의 삭제를 소유한다. 상세·수정 같은 나머지 후속 흐름은 별도 하위 흐름/도메인으로 분리한다.

## 읽어야 하는 경우
- `src/app/saved/**`, `src/widgets/saved/**`, `src/features/saved/**`, `src/shared/static/saved/**`를 수정할 때
- 찜한 코스 목록, 빈 상태, 카드 표시 계약, 상세 진입 링크를 수정할 때
- 저장 코스 목록 테스트나 접근성 검증을 추가할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/saved` | Route | `src/app/saved/page.tsx` |
| `/saved/[id]` | Route | `src/app/saved/[id]/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/saved/**` |
| `widgets` | `src/widgets/saved/**` |
| `features` | `src/features/saved/**` |
| `shared/static` | `src/shared/static/saved/**` |
| `shared/ui` | `AppShell`, `NavBar` 등 목록 화면에서 재사용하는 공용 primitive |

## 사용자 플로우
1. 사용자가 홈 또는 직접 URL로 `/saved`에 진입한다.
2. 저장 코스가 있으면 목록을 보고, 없으면 빈 상태 문구를 본다.
3. 사용자가 카드 클릭으로 저장 코스 상세 `/saved/[id]`에 진입한다.
4. 상세 화면에서 순서를 바꾸거나 원래 순서로 되돌리고, 공유 또는 수정완료 CTA를 본다.
5. 사용자가 목록 카드의 삭제 버튼을 눌러 확인 모달을 열고, 확인하면 해당 코스가 목록에서 제거된다(마지막 코스면 빈 상태로 전환).

## Subflows
- `SavedCourseDetail`

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `SavedCourseCardViewModel` | `id`, `name`, `desc?`, `meta`, `date` | `src/features/saved/model/saved-course.ts` |
| `SavedCourseMeta` | string | `src/features/saved/model/saved-course.ts` |
| `SavedCourseDateLabel` | string | `src/features/saved/model/saved-course.ts` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `OpenSavedCourses` | 사용자가 홈에서 찜한 코스 카드 클릭 | `Saved` 도메인 진입 |
| `OpenSavedCourseDetail` | 사용자가 목록 카드를 클릭 | 저장 코스 상세 분기 진입 |
| `ReorderSavedCoursePlaces` | 사용자가 상세 화면에서 드래그 | 상세 화면 방문 순서 변경 |
| `ResetSavedCoursePlaces` | 사용자가 원래 순서로 클릭 | 저장된 원래 순서 복구 |
| `ShareSavedCourse` | 사용자가 길안내 공유 클릭 | 현재 방문 순서 기준 네이버지도 길안내 링크 공유 또는 복사 |
| `CompleteSavedCourseEdit` | 사용자가 수정완료 클릭 | 수정 API 연결 전까지 안내 토스트 |
| `RequestDeleteSavedCourse` | 사용자가 목록 카드의 삭제 버튼 클릭 | 삭제 확인 모달 표시 |
| `ConfirmDeleteSavedCourse` | 확인 모달에서 삭제 확인 | `DELETE /api/courses/{id}` 호출, 성공 시 목록에서 제거 |
| `CancelDeleteSavedCourse` | 확인 모달에서 취소/Esc | 모달 닫고 목록 유지 |

## States

| State | 의미 |
| --- | --- |
| `SavedListReady` | 저장 코스 목록이 렌더된 상태 |
| `SavedListEmpty` | 저장 코스가 없어 빈 상태 문구가 렌더된 상태 |
| `SavedCourseDetailReady` | 저장 코스 상세 지도가 렌더된 상태 |
| `SavedCourseDetailReordered` | 저장 코스 상세 순서가 바뀐 상태 |
| `SavedCourseDeleteConfirming` | 목록에서 특정 코스 삭제 확인 모달이 열린 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| 외부 진입 | `OpenSavedCourses` | `SavedListReady` | 저장 코스 데이터가 있을 때 |
| 외부 진입 | `OpenSavedCourses` | `SavedListEmpty` | 저장 코스 데이터가 없을 때 |
| `SavedListReady` | `OpenSavedCourseDetail` | `SavedCourseDetailReady` | 상세 라우트가 SSR로 상세 데이터를 준비 |
| `SavedCourseDetailReady` | `ReorderSavedCoursePlaces` | `SavedCourseDetailReordered` | 상세 화면 클라이언트 상태로만 순서 변경 |
| `SavedCourseDetailReordered` | `ResetSavedCoursePlaces` | `SavedCourseDetailReady` | 서버 원본 순서로 되돌림 |
| `SavedListReady` | `RequestDeleteSavedCourse` | `SavedCourseDeleteConfirming` | 목록에서 삭제 확인 모달 오픈 |
| `SavedCourseDeleteConfirming` | `CancelDeleteSavedCourse` | `SavedListReady` | 모달 닫고 목록 유지 |
| `SavedCourseDeleteConfirming` | `ConfirmDeleteSavedCourse` | `SavedListReady` | 삭제 성공 후 해당 카드 제거(코스가 남아 있을 때) |
| `SavedCourseDeleteConfirming` | `ConfirmDeleteSavedCourse` | `SavedListEmpty` | 마지막 코스를 삭제한 경우 |

## Invariants
- `Saved`는 저장 코스 목록과 상세 조회/편집 진입을 소유한다.
- `SavedListScreen`은 목록 조합만 담당하고 데이터 fetch 규칙이나 상세 전이를 직접 소유하지 않는다.
- `SavedCourseDetailScreen`은 공통 지도 화면 셸을 조합하고, 수정 저장 transport는 직접 소유하지 않는다.
- 빈 상태와 목록 상태는 동시에 렌더되면 안 된다.
- 목록 카드는 동일한 표시 계약(`name`, `desc?`, `meta`, `date`)으로 렌더되어야 한다.
- 상세 화면은 저장된 원래 순서를 reset 기준으로 유지해야 한다.
- 목록 삭제의 상태(모달 열림·선택 코스·pending·error)와 삭제 orchestration은 UI가 아니라 feature 훅이 소유해야 한다.
- 목록은 삭제 성공 시 해당 코스만 제거하고, 브라우저는 BFF `DELETE /api/courses/{id}`만 호출해야 한다.

## UI 계약
- 목록이 있으면 `ul/li` 구조로 렌더해야 한다.
- 빈 상태 문구는 목록이 없을 때만 노출해야 한다.
- 카드 클릭이 실제 상세 진입을 의미한다면 링크 또는 링크 기반 affordance 로 구현해야 한다.
- 목록 카드의 삭제는 상세 이동 Link 안에 중첩하지 않고, `aria-label`을 가진 별도 버튼으로 제공해야 한다.
- 삭제 확인은 공용 `ConfirmDialog`(danger 톤, 포커스 트랩/복원/Escape/pending 잠금)를 사용해야 한다.
- 화면 골격은 기존 공용 레이아웃 primitive 우선 검토 대상이다.
- 상세 화면은 추천 후 지도 화면과 동일한 지도/리스트 UX를 사용하되 footer CTA만 저장 상세 문맥에 맞게 분기한다.
- 길안내 공유 CTA는 보호 라우트 URL이 아니라 외부에서 열 수 있는 네이버지도 길안내 링크를 공유해야 한다.

## SSR / BFF / 데이터 규칙
- 저장 코스 목록은 초기 렌더에 바로 필요하므로 SSR 또는 Server Component에서 먼저 준비한다.
- 저장 코스 목록 API는 외부 백엔드에 직접 붙지 않고 서버 계층 또는 BFF `/api/courses` GET을 사용한다.
- 저장 코스 상세는 SSR 또는 Server Component에서 `GET /api/courses/{id}`를 먼저 준비한다.
- 저장 코스 수정은 PUT/PATCH 계약이 오기 전까지 실제 저장 transport를 연결하지 않는다.
- 저장 코스 삭제는 브라우저가 BFF `DELETE /api/courses/{id}`만 호출하고, 외부 백엔드 직접 호출과 삭제 orchestration은 shared 서버 계층과 feature 훅이 소유한다.
- 길안내 공유는 서버 API 없이 현재 순서의 좌표 기반 네이버지도 웹 길찾기 링크를 사용할 수 있다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `SavedListScreen` | UIArtifact | `src/widgets/saved/SavedListScreen.tsx` |
| `SavedCourseListClient` | UIArtifact | `src/widgets/saved/SavedCourseListClient.tsx` |
| `SavedCourseDetailScreen` | UIArtifact | `src/widgets/saved/SavedCourseDetailScreen.tsx` |
| `SavedCourseCard` | UIArtifact | `src/features/saved/ui/SavedCourseCard.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `Saved` route entry | `src/app/saved/page.tsx` |
| `Saved detail route entry` | `src/app/saved/[id]/page.tsx` |
| `SavedListScreen` 조합 | `src/widgets/saved/SavedListScreen.tsx` |
| `SavedCourseDetailScreen` 조합 | `src/widgets/saved/SavedCourseDetailScreen.tsx` |
| `SavedCourseCard` public API | `src/features/saved/index.ts` |
| `Saved` 목록 삭제 orchestration | `src/features/saved/hooks/useSavedListScreen.ts`, `useDeleteSavedCourse.ts` |
| `Saved` 삭제 BFF/서버 transport | `src/app/api/courses/[id]/route.ts` (DELETE), `src/shared/api/server-course.ts` |
| `Saved` page data prepare | `src/features/saved/server/get-saved-page-data.ts` |
| `Saved detail page data prepare` | `src/features/saved/server/get-saved-course-detail-page-data.ts` |
| `Saved` 정적 문구 | `src/shared/static/saved/index.ts` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Saved` | `hasRoute` | `/saved` |
| `Saved` | `renders` | `SavedListScreen` |
| `Saved` | `renders` | `SavedCourseDetailScreen` |
| `SavedListScreen` | `renders` | `SavedCourseCard` |
| `Saved` | `uses` | `src/shared/static/saved` |
| `OpenSavedCourses` | `dependsOn` | `Home` |
| `OpenSavedCourseDetail` | `dependsOn` | `/saved/[id]` |

## Out Of Scope
- 저장 코스 수정(수정완료 CTA는 안내 토스트까지만)
- 저장 코스 상세(`/saved/[id]`) 화면에서의 삭제, 삭제 undo(되돌리기)
- 로그인 기반 필터링
## 테스트 포인트
- 목록 데이터 유무에 따라 빈 상태와 리스트 분기가 올바르게 바뀌는지 확인한다.
- 카드 표시 계약(`name`, `desc?`, `meta`, `date`)이 유지되는지 확인한다.
- 상세 링크가 실제 `/saved/[id]`로 연결되는지 확인한다.
- 상세 API 응답이 공통 지도 화면 계약으로 정규화되는지 확인한다.
- 수정완료 CTA는 순서 변경 전후 disabled 정책과 임시 안내 토스트를 검증한다.
- 길안내 공유 CTA는 현재 정렬 순서 기준의 네이버지도 길안내 링크를 대상으로 동작해야 한다.
- 목록 카드 삭제: 확인 모달 표시, 취소 시 목록 유지, 확인 시 해당 카드 제거, 마지막 코스 삭제 시 빈 상태 전환, 실패 시 모달 유지·오류 노출을 검증한다.

## Validation Rules
- `SavedListScreen`은 조합 아티팩트로 유지되어야 한다.
- `SavedCourseCard`는 표시용 계약을 벗어난 상세 비즈니스 규칙을 소유하면 안 된다.
- `SavedCourseDetailScreen`은 공통 지도 화면 셸 위에 CTA 정책만 덧붙여야 하며, saved 위젯 안에서 backend transport를 직접 호출하면 안 된다.
