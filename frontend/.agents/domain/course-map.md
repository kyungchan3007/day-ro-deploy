# 도메인 온톨로지: Course > CourseMapPreview

## Canonical Term
- `CourseMapPreview`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `course-map` | code path | `src/features/course-map`, `src/widgets/course-map` |
| `course` | query step | `/course/new?step=course` |

## Domain Goal
- 확정한 코스를 지도와 리스트로 보여주고 저장 전 확인 및 후속 입력 진입점을 제공한다.

## 읽어야 하는 경우
- `src/widgets/course-map/**`, `src/features/course-map/**`를 수정할 때
- 지도 SDK 연동, URL 기반 선택 복원, 코스 순서 리스트, 저장 sheet를 수정할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/course/new?step=course` | Route 상태 | `src/widgets/course-map/CourseMapScreen.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `widgets` | `src/widgets/course-map/**` |
| `features` | `src/features/course-map/**` |
| `shared/ui` | 지도 외 레이아웃, 버튼, sheet 등 재사용 primitive |

## 사용자 플로우
1. 선택완료 후 확정 코스 화면이 열린다.
2. 사용자가 지도와 코스 순서를 확인한다.
3. 사용자가 저장 sheet 에서 코스명을 입력해 저장하거나 이전 결과 화면으로 이동한다.

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `OpenCourseMapPreview` | 선택완료 클릭 | 지도 화면 진입 |
| `RestoreSelectedCourse` | URL query 읽기 | 지도/리스트 view-model 복원 |
| `OpenSaveCourseSheet` | 저장 CTA 클릭 | 저장 sheet 오픈 |
| `SubmitSaveCourse` | 저장 sheet 제출 | 로그인 세션이면 코스 저장 요청 전송 |
| `CloseSaveCourseSheet` | sheet 닫기 | sheet 종료 |
| `StartRouteGuide` | 경로 안내 CTA 클릭 | 좌표 있는 장소 2곳 이상이면 네이버 웹 길찾기를 별도 탭으로 오픈 |
| `ReturnToCandidates` | 뒤로가기 | 결과 화면 복귀 |

## States

| State | 의미 |
| --- | --- |
| `CourseMapReady` | 지도와 리스트가 렌더된 상태 |
| `SaveCourseSheetOpen` | 저장 sheet 가 열린 상태 |
| `CourseSaveSubmitting` | 저장 요청이 진행 중인 상태 |

## Invariants
- 지도 화면은 선택된 코스 데이터가 있어야 의미 있게 렌더된다.
- 지도 SDK 접근은 feature hook/lib 가 소유해야 한다.
- 선택 복원은 widget 이 아니라 feature hook/lib 가 소유해야 한다.
- 저장 sheet 정책과 열림 상태는 화면 조합과 분리되어야 한다.
- `step=course`는 URL query만으로 선택 장소를 복원할 수 있어야 한다.
- 저장 요청은 현재 정렬 순서와 상황입력 answers를 함께 사용해 BFF 계약으로 직렬화해야 한다.
- 비로그인 상태 저장 시도는 로그인 진입으로 연결되어야 한다.

## UI 계약
- 코스 순서는 지도와 리스트에서 일관되게 보여야 한다.
- 저장 CTA와 뒤로가기 동작은 명확히 구분되어야 한다.
- 저장 sheet 나 overlay 는 기존 공용 primitive 재사용 가능 여부를 먼저 검토해야 한다.
- 저장 sheet 입력 초안은 feature model 이 소유하고, 백엔드 계약에 없는 필드는 직렬화 단계에서 제외한다.

## SSR / BFF / 데이터 규칙
- 지도 SDK는 클라이언트 전용 자원이다.
- 초기 코스 데이터는 서버가 URL query에서 복원해 page props로 내려준 값을 사용한다.
- 외부 지도 SDK 로더와 URL 기반 선택 복원은 feature 계층으로 제한한다.
- 저장 요청은 클라이언트에서 외부 백엔드로 직접 보내지 않고 BFF `/api/courses`를 거쳐야 한다.
- 저장 응답은 현재 화면에서 토스트 등 후속 UX로만 소비하고 widget 본문이 요청 조립을 소유하지 않는다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `CourseMapScreen` | UIArtifact | `src/widgets/course-map/CourseMapScreen.tsx` |
| `CourseMap` | UIArtifact | `src/features/course-map/ui/CourseMap.tsx` |
| `CoursePlaceList` | UIArtifact | `src/features/course-map/ui/CoursePlaceList.tsx` |
| `SaveCourseSheet` | UIArtifact | `src/features/course-map/ui/SaveCourseSheet.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| 화면 orchestration | `src/features/course-map/hooks/useCourseMapScreen.ts` |
| 선택 복원 | `src/features/course-map/hooks/useSelectedCourse.ts` |
| 지도 SDK orchestration | `src/features/course-map/hooks/useKakaoMap.ts` |
| 지도 로더 | `src/features/course-map/lib/kakao-map-loader.ts` |
| route page data prepare | `src/features/situation/server/get-course-new-page-data.ts` |

## Out Of Scope
- 인앱 경로 렌더링(폴리라인/턴바이턴 등 자체 길안내)
- 실시간 위치 추적

## 외부 길안내 규칙
- "경로 안내 시작하기" CTA 는 자체 내비를 그리지 않고 네이버 웹 길찾기를 별도 탭으로 연다.
- 길찾기 URL은 좌표 있는 장소가 2곳 이상일 때만 만든다. 좌표 없는 장소는 경로에서 제외하고, 2곳 미만이면 안내 토스트만 노출한다.
- 방문 순서대로 첫 장소=출발, 마지막=도착, 중간=경유지로 구성한다.
- 코스 장소는 도보권에 모여 있으므로 장소 간 이동은 이동수단 선택과 무관하게 항상 도보(walk)로 안내한다.
- 길찾기 URL 조립(순수 규칙)은 feature lib 가, 새 탭 열기(브라우저 API)는 feature hook 이 소유한다. widget 본문에 두지 않는다.

## 테스트 포인트
- URL 기반 선택 복원 규칙을 검증한다.
- 지도용 point 변환 규칙을 검증한다.
- 저장 sheet 오픈/클로즈와 뒤로가기 정책을 검증한다.
- 저장 요청 payload 조립과 인증 실패 처리 규칙을 검증한다.

## Validation Rules
- 지도 SDK와 URL 기반 선택 복원 규칙이 widget 본문으로 새지 않도록 검증한다.
- `places -> map points` 같은 파생 변환은 screen 본문이 아니라 model/hook 이 소유해야 한다.
- 저장 정책과 overlay open/close 정책이 화면 조합 파일에 과밀하게 쌓이면 분리 후보로 본다.
