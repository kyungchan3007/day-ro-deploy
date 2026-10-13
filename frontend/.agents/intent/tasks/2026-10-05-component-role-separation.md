# 컴포넌트·컨트롤러 역할 분리

## Task Meta
- task_id: 2026-10-05-component-role-separation
- date: 2026-10-05
- owner: Claude(구현) / 독립 검증 세션(검증)
- status: approved(approve-with-notes) — 독립 검증 세션
- task_type: 리팩터(동작 변경 없음)
- linked_prd: `intent/prd/2026-10-05-component-role-separation.md`
- linked_sdd: `intent/sdd/2026-10-05-component-role-separation.md`
- branch: `refactor/#133-component-role-separation`

## Tasks
- [x] T1 shared/ui/lib `useIsClient`·`trapTabFocus`·`useModalDialog` + SideMenu·ConfirmDialog·useSaveCourseSheetDialog 적용
- [x] T2 `useSelect` 분리
- [x] T3 `useSituationFlowController` 분리(navigation·redirects·retry notice·messages)
- [~] T4 `course-generation-runner` 분리 — 보류: 전 라우트 +12KB(Turbopack 모듈 병합 깨짐), SDD 4
- [x] T5 `useCoursePreviewOrder`·`buildLoginRedirectPath` 공용화
- [x] T6 `useFaqSearch`·`useWebVitalsLogger`
- [x] T7 미사용 코드 삭제(사용자 승인 "전부 삭제"): SituationTransportScreen(+css), TransportCardGroup(+css), useTransportStep, useSelectedCourse + 배럴 export 정리. 삭제 후 고아가 된 `features/situation/ui/transportMeta.ts`는 승인 범위 밖이라 유지(후속)
- [x] T8 검증: lint·tsc·unit·build·번들 예산·e2e, 독립 검증 세션 리뷰, validation report

- [x] T9 후속(사용자 지시): 모달·Select·저장 시트 키보드/포커스 play 테스트 7건, `transportMeta.ts` 삭제, shared → features/auth 경계 위반 해소(SDD 7)

## Acceptance Criteria
- must: 대상 tsx 컴포넌트에 `useState`/`useEffect`/document·window 접근이 남지 않는다(훅으로 이동).
- must: 포커스 트랩·마운트 감지 구현이 shared/ui/lib 한 곳에만 존재한다.
- must: 화면 동작·키보드·포커스(초기 포커스, ESC, Tab 순환, 복원)·라우팅이 기존과 같다.
- must: `useSituationFlowController` 반환 계약이 바뀌지 않는다.
- must not: 번들 예산 baseline 상향, 디자인·문구 변경.

## Evidence Plan
- unit: `trapTabFocus` 순수 함수, `useCoursePreviewOrder`·`buildLoginRedirectPath`, 기존 situation·course-map·saved·faq 테스트 회귀
- e2e: 전체(사용자 지시 범위)
- 번들: `node scripts/check-route-bundle-budget.mjs`

## Evidence Result
- 구현: Claude / 검증: 독립 검증 세션 — approve-with-notes(P1·P2 없음), 리포트 `.agents/reports/validation/2026-10-05-component-role-separation.md`
- lint 0 errors · tsc · build · unit 694 통과(전체 병렬 실행 시 기존 flaky `contact-form.test.tsx` 타임아웃 2건, 단독 통과) · 신규 unit 9건(`focus-trap`, `course-order`)
- 번들 예산 통과(develop 대비): `/` 631,506→631,987B, `/course/new` 675,059→675,823B, `/saved` 701,104→700,986B
- e2e 18/18 통과(start 모드 3100, 사용자 dev 서버 3000 미접촉)
- 검증 P3 반영: course-map 기준 순서 마운트 고정 조건 문서화, SDD 시그니처·domain/course-map.md 갱신, 테스트 mock 의도 주석, 리팩터/삭제 커밋 분리
- 후속(T9) 반영: storybook play 7건 추가(관련 스토리 16/16 통과, SaveCourseSheet 저장 중 포커스 테스트는 이전 구현에서 실패 확인), `transportMeta.ts` 삭제, `shared/api/auth-cookies.ts`·`auth-session.ts` 신설로 shared → features import 0건
- T9 후 재검증: lint 0 errors · tsc · unit 700 통과(기존 flaky contact-form 2건) · build · 번들 예산(`/` 631,987B, `/course/new` 675,823B, `/saved` 700,986B) · e2e 18/18
