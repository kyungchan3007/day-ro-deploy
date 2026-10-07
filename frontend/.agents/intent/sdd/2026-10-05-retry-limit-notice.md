# 다른 코스 보기 한도 소진 안내 SDD

## Meta
- sdd_id: 2026-10-05-retry-limit-notice
- date: 2026-10-05
- owner: Claude(UI/UX 구현) / Codex(validation gate)
- status: active
- supersedes: -
- superseded_by: -

## Scope Path
- affected routes: `/course/new?step=result`
- affected slices: `widgets/situation/hooks/useSituationFlowController.ts`, `widgets/situation/SituationFlow.tsx`, `widgets/course-result/CourseResultScreen.tsx`, `e2e/course/course-new.spec.ts`
- related guides: `client-logic-separation.md`, `accessibility.md`, `performance.md`(INP — 클릭 시 동기 토스트만)
- related domains: `course-result.md`, `course-situation.md`

## Design Decisions
- SSR/BFF/client boundary: 변경 없음. 한도 판단은 서버가 내려준 `remainingRetries`를 그대로 사용, 신규 API 없음.
- 한도 소진 정책 owner: `useSituationFlowController.handleReroll`. `remainingRetries <= 0`이면 retry 라우트 전환 없이 `show(안내, "info")`. 위젯은 `retryExhausted` 표시값만 받는다.
- 위젯: 소진 상태에서 버튼을 `disabled` 대신 `aria-disabled="true"` + `aria-disabled:opacity-40`(기존 disabled 시각과 동일)로 표시해 클릭·포커스 가능. 소진 상태 클릭은 선택 초기화·transition 없이 `onReroll`만 위임.
- 공용 UI: `shared/ui/button` API 변경 없음(위젯 className으로 처리), `useToast`·`Toast` 재사용.
- 기존 진입 토스트("다른 코스 보기를 모두 사용했어요.")는 유지 — 0 도달 시 1회 사전 안내, 클릭 안내는 별도 문구.
- 분석 이벤트(`course_retry_limit_reached`)는 #125에서 이 handler 분기에 연결.

## Risks
- 빈 결과 화면 '다시 추천받기' 버튼이 `rerollDisabled`(isEmpty 포함)로 항상 비활성인 기존 결함 발견 → 이번 변경에서 빈 상태 버튼은 `rerolling`만 비활성 조건으로 수정(별도 `bug` 커밋).
- 백엔드 `COURSE_RETRY_LIMIT_EXCEEDED`가 BFF에서 502 일반 오류로 변환됨 → 화면 숫자 불일치 시 로딩 화면에서 실패 처리. 후속 확인(Codex owner, BFF 오류 매핑).

## Validation Notes
- what must be reviewed: 소진 시 라우트/API 미발생, 토스트 노출, 비소진 기존 흐름 회귀 없음, aria-disabled 접근성, UI 파일 정책 혼입 최소화.
- expected evidence: lint, unit test, build, e2e 기대값 갱신(실행은 사용자 지시 시), Codex review.
