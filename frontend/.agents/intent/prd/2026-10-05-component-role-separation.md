# 컴포넌트·컨트롤러 역할 분리 PRD

## Meta
- prd_id: 2026-10-05-component-role-separation
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시 "바로 작업") / 독립 검증 세션(검증)
- issue: Dayro-dev/dayro#133

## Problem
- `widgets/situation/hooks/useSituationFlowController.ts`(334줄)에 주소 이동·복원 실패 리다이렉트·생성 실패 안내·재추천 소진 안내·토스트·단계별 액션이 한 파일에 섞여 있다.
- 모달 포커스 트랩(ESC·Tab 순환·초기 포커스·포커스 복원)이 `SideMenu`, `ConfirmDialog`, `useSaveCourseSheetDialog` 3곳에 거의 같은 코드로 중복돼 있다. hydration-safe `mounted` 감지도 3곳에 중복.
- `Select`(234줄) 컴포넌트 안에 열림·하이라이트·키보드 탐색·바깥 클릭 로직이 마크업과 섞여 있다.
- `useCourseMapScreen`·`useSavedCourseDetailScreen`에 장소 순서 변경 state·로그인 리다이렉트 경로 조립이 중복.
- `useCourseGeneration`에 모듈 단위 실행부(`runOperation`·`liveOperations`)가 훅과 섞여 있다.
- `FaqSearchableList`, `WebVitalsLogger` 컴포넌트에 상태·이펙트가 직접 들어 있다.
- 사용자 영향: 없음. 개발 영향: 수정 시 영향 범위 파악이 어렵고, 같은 a11y 버그를 3곳에서 고쳐야 한다.

## Goal
- 컴포넌트(tsx)는 마크업·조합만, 상태·이펙트·브라우저 API는 커스텀 훅, 순수 규칙은 model/lib 에 둔다.
- 중복된 포커스 트랩·마운트 감지·순서 변경 로직을 단일 구현으로 합친다.
- 화면 동작·접근성·번들 크기 회귀 없이 끝낸다(동작 변경 없음이 원칙).

## In Scope
- shared/ui/lib: `useIsClient`, `useModalDialog`(+ 순수 `trapTabFocus`) 추출 → SideMenu·ConfirmDialog·useSaveCourseSheetDialog 적용
- shared/ui/select: `useSelect` 분리
- widgets/situation/hooks: 컨트롤러를 navigation·redirects·retry notice 훅으로 분리
- features/situation: 생성 실행부 lib 분리 시도(번들 +12KB 로 보류, SDD 4)
- shared/lib/course-preview: `useCoursePreviewOrder` 공용 훅, shared/lib 로그인 경로 `buildLoginRedirectPath`
- features/faq `useFaqSearch`, shared/observability `useWebVitalsLogger`
- 미사용 코드 정리: `SituationTransportScreen`(+css), `useSelectedCourse` — 삭제는 사용자 승인 후

## Out of Scope
- 디자인·문구·레이아웃 변경
- 상태 저장 구조(#129 흐름 상태) 변경
- 백엔드 502(Gemini 간헐 실패) — 백엔드 담당
