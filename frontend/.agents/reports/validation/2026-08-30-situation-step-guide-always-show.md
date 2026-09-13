# 코스 만들기 진행순서 안내 토스트 매 진입 노출 검증 리포트

## 작업 일시 (실행 날짜)
- `2026-08-30`

## Intent Source (의도 출처)
- task_id: `2026-08-30-situation-step-guide-always-show`
- intent artifact: 사용자 요청의 inline Execution Spec
- 의도: 첫 `time` 스텝의 신규 진입 안내 토스트를 방문자당 1회가 아니라 신규 진입마다 노출하고, 딥링크·복귀 차단과 2초 자동 소멸 및 hydration 안전은 유지한다.

## 검증 대상 (대상 파일 / 범위)
- `src/widgets/situation/hooks/useSituationStepGuideVisibility.ts`
- `src/widgets/situation/hooks/useSituationStepGuideVisibility.test.ts`
- 결선 확인: `src/widgets/situation/hooks/useSituationFlowController.ts`, `src/widgets/situation/SituationFlow.tsx`
- 변경 금지 확인: `src/features/situation/ui/SituationStepGuide.tsx`

## 최종 결정 (판정 결과)
- `approved_with_notes`
- 필수 acceptance criteria와 요청된 범위 검증은 통과했다. 추가 실행한 전체 테스트 프로세스의 샌드박스 포트 권한 오류와 결선 훅의 기존 ESLint 오류는 아래 미검증 항목에 분리 기록한다.

## Acceptance Criteria 확인 (완료 조건 점검)
- 충족: `/course/new`가 explicit `step` 없이 `time`으로 신규 진입할 때마다 노출 판정이 `true`다.
- 충족: `?step=time|region|purpose|result|course`처럼 explicit step이 있으면 노출하지 않는다.
- 충족: explicit query 없이도 현재 스텝이 `region` 또는 `purpose`이면 노출하지 않는다.
- 충족: 결과/코스 화면과 그 화면에서의 복귀는 URL에 explicit step이 있으므로 기존 결선에서 계속 미노출이다.
- 충족: 기본 지속 시간은 `2000ms`이며 자동 dismiss 타이머 동작을 유지한다.
- 충족: 초기 React state는 `false`이고 진입 판정 및 state 변경은 client effect에서만 수행한다. 서버 렌더 중 DOM/storage 접근은 없다.
- 충족: localStorage key, storage type, 접근·예외 처리, persistence claim이 모두 제거됐다.
- 충족: `SituationStepGuide.tsx`의 시각·마크업·문구를 수정하지 않았다.

## 변경 파일 요약 (수정 범위)
- `src/widgets/situation/hooks/useSituationStepGuideVisibility.ts`: persistence claim을 순수 진입 판정 함수로 교체하고 localStorage 관련 코드·상수를 제거했다.
- `src/widgets/situation/hooks/useSituationStepGuideVisibility.test.ts`: 1회 제한과 storage 실패 테스트를 제거하고 매 신규 진입 재노출 테스트로 교체했다. 딥링크·복귀 차단과 2초 소멸 검증은 유지했다.
- `.agents/reports/validation/2026-08-30-situation-step-guide-always-show.md`: 본 검증 판정과 근거를 추가했다.
- 삭제 파일: 없음.
- 결선 파일과 프레젠테이션 컴포넌트: 확인만 했으며 이번 정책 변경에서 수정하지 않았다.

## 실행 루프 요약 (작업 흐름 요약)
- loop type: `Quick Loop` (구현 코드 2개 파일의 정책 변경, 기존 결선/API 불변)
- iterations: `2` (첫 storage 잔재 검색에서 cwd 기준 경로를 중복 지정한 명령 오류 후 올바른 상대 경로로 재실행)
- handoff 사용 여부: `no` (사용자가 다른 MCP/Claude 재귀 호출을 금지했고 프레젠테이션 변경이 없음)
- evidence bundle: `Quick Code Bundle + Validation Bundle`

## 실행한 검증 명령 (검증 커맨드)
- `npx vitest run src/widgets/situation/hooks/useSituationStepGuideVisibility.test.ts` → 통과 (`1 file`, `9 tests`).
- `npx tsc --noEmit` → 통과.
- `npx eslint src/widgets/situation/hooks/useSituationStepGuideVisibility.ts src/widgets/situation/hooks/useSituationStepGuideVisibility.test.ts src/widgets/situation/SituationFlow.tsx src/features/situation/ui/SituationStepGuide.tsx src/features/situation/index.ts` → 통과.
- `rg -n "SITUATION_STEP_GUIDE_STORAGE_KEY|claimSituationStepGuideEntry|dayro:course-new:situation-step-guide:v1|localStorage|StepGuideStorage|persistence" src/widgets/situation src/features/situation --glob '!*.md'` → 일치 항목 없음.
- `git diff --check` → 통과.
- 추가 확인 `npx vitest run` → 테스트 `34 files`, `150 tests`는 모두 통과했으나 Vitest browser worker의 `listen EPERM ::1` unhandled error로 프로세스 exit 1.
- 추가 확인 `npx eslint ... useSituationFlowController.ts ...` → 이번 변경과 무관한 기존 `react-hooks/set-state-in-effect` 1건으로 exit 1 (`useSituationFlowController.ts:148`).

## Evidence Gate (증거 통과 여부)
- intent artifact: 통과 (사용자 inline Execution Spec과 acceptance criteria).
- tests: 통과 (관련 테스트 9/9).
- typecheck: 통과.
- build: `not_run` — 사용자가 요구한 evidence가 아니며 로직·API·빌드 설정 변경이 없는 Quick Loop다. 타입 검사와 관련 테스트로 대체했다.
- additional review: 통과 (storage 잔재 검색, hydration 초기 상태/effect 경계, 딥링크·복귀 결선, VSA 위치, 변경 금지 UI diff 확인).
- skipped with reason: e2e는 사용자 명시 실행 요청이 없어 저장소 규칙에 따라 미실행.

## 구조 / VSA 검토 결과 (아키텍처 판단)
- 노출 정책과 timer/state effect는 기존 `widgets/situation/hooks`에 머물고 프레젠테이션 feature UI로 새지 않았다.
- `SituationFlow`는 controller가 제공한 boolean으로 완성형 feature UI를 조건부 조합하는 기존 얇은 switcher 역할을 유지한다.
- `useSituationFlowController`는 `searchParams.has("step")`을 전달하므로 explicit 딥링크와 flow 내부 복귀를 계속 구분한다.
- 초기 렌더는 `false`이며 `window`, localStorage, DOM 접근이 없어 SSR/hydration 경계를 유지한다.
- storage key 문자열과 persistence 관련 타입·함수·주석의 잔재가 대상 slice에 없다.
- shared 승격이나 feature API 변경은 없다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `external_blocker`: 전체 Vitest 추가 실행은 모든 테스트 assertion 통과 후 샌드박스가 IPv6 loopback 포트 listen을 거부해 exit 1이었다. 필수 관련 테스트는 node 환경에서 별도 통과했다.
- `pre_existing_lint_debt`: 결선 훅 전체 린트 시 `useSituationFlowController.ts:148`의 기존 결과 상태 동기화 effect에서 `react-hooks/set-state-in-effect` 1건이 확인됐다. 이번 노출 정책 변경 라인과 무관해 최소 변경 범위에서 수정하지 않았다.
- production build와 e2e는 미실행이다.

## 남은 리스크 및 후속 작업 (후속 조치)
- 실제 브라우저에서 route가 완전히 재진입할 때 component remount가 일어난다는 현재 Next.js route 구조를 전제로 한다. 동일 mount 안의 query 없는 `time` 상태 재설정은 `evaluated` ref 때문에 재노출하지 않으며, 이는 flow 내부 복귀 미노출 요구와 일치한다.
- 전체 suite의 browser worker 검증은 로컬 포트 listen이 허용되는 환경에서 재실행할 수 있다.
- `useSituationFlowController.ts:148`의 기존 ESLint 부채는 별도 리팩터링 범위로 분리하는 것이 안전하다.
