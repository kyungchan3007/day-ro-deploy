# Run Log - 2026-10-05-retry-limit-notice

## Meta (기본 정보)
- task_id: 2026-10-05-retry-limit-notice (Dayro-dev/dayro#126)
- date: 2026-10-05
- task_type: 검증 / diff review (방식 B)
- owners: Claude(기존 구현 및 실행 evidence 제공), Codex ValidationAgent(이번 독립 정적 리뷰)
- intent_source: `../../intent/sdd/2026-10-05-retry-limit-notice.md`, `../../intent/tasks/2026-10-05-retry-limit-notice.md`, 사용자 요청
- loop_type: full_loop의 validation/report 단계
- iterations: 1 (이번 리뷰 1회; 구현 재시도 없음)
- decision: rejected (사용자 표기: reject)

## Documents Loaded (읽은 문서)
- `frontend/AGENTS.md`, `.agents/README.md`: 리뷰 범위, 소스 수정 금지 및 e2e 실행 제한 적용.
- `.agents/intent/README.md`, `.agents/intent/active/index.md`, 위 SDD/Execution Spec: 대상 작업과 AC 고정. SDD가 지정한 기존 flow controller owner를 인정하며, 전체 경로 이전은 요구하지 않음.
- `.agents/agents/validation.md`, `.agents/context/README.md`: 독립 구조 검토와 evidence 출처 구분.
- `.agents/guides/client-logic-separation.md`: 위젯에 추가된 이벤트 정책의 책임 경계 판단.
- `.agents/guides/accessibility.md`: 네이티브 버튼, disabled/aria-disabled, 키보드 및 live region 검토.
- `.agents/guides/performance.md`: 클릭 경로의 추가 요청/연산 여부 및 제공된 bundle budget 결과 확인.
- `.agents/domain/course-result.md`, `.agents/domain/course-situation.md`: 선택 및 재추천 orchestration 책임 확인.
- `.agents/harness/README.md`, `.agents/harness/observability.md`: 단계, gate, failure taxonomy 기록.
- `.agents/reports/README.md`, `.agents/reports/runs/README.md`: decision vocabulary 및 이 run log 형식 적용.
- 제외: onboarding, 무관 도메인/과거 intent, 상세 BFF/server boundary/Storybook 가이드. 해당 구현 변경 없음. 관련 skill은 이번 제한된 정적 리뷰에서 별도 적용하지 않음.

## Current Stage (현재 단계)
- Report 완료. Validation Gate에서 수정 필요 판정.

## Stages Visited (방문한 실행 단계)
- Intent Capture: 사용자 AC와 기존 intent 확인. 전달 diff는 `DIFF_PLACEHOLDER`이므로 현재 워킹트리 `git diff -- frontend/src`를 실제 리뷰 대상으로 사용.
- Context Load: 위 문서와 변경 4개 소스 파일, Button/Toast/useToast, 후보 복원 훅, 설치된 Playwright 구현 확인.
- Plan and Boundary Decision: 리뷰와 이 리포트 작성만 수행. Claude 재호출, 앱 코드/테스트 수정, e2e 실행 없음.
- Implement: 이번 역할에서는 해당 없음. 기존 변경은 결과 위젯, flow props, flow controller, e2e 기대값.
- Self Check: 소진/비소진/undefined/빈 결과/진행 중/연속 클릭/진입 토스트 경로 정적 추적.
- Evidence Run: 제공된 실행 결과를 인용하고 로컬 `git diff --check` 및 의존성 소스 확인 수행.
- Validate: 아래 F1–F3에 따라 rejected.
- Report: 사용자 지정 run log에 판정 및 findings 기록.

## Evidence Summary (증거 요약)
- evidence_bundle: Validation Bundle (제공 실행 evidence + 독립 정적 리뷰)
- commands:
  - Claude 실행 완료로 사용자 제공: `npm run lint` — 0 errors, 기존 warning 2.
  - Claude 실행 완료로 사용자 제공: `npm run test:unit` — 73 files / 591 tests pass.
  - Claude 실행 완료로 사용자 제공: `npm run build` — 성공.
  - Claude 실행 완료로 사용자 제공: `node scripts/check-route-bundle-budget.mjs` — 통과.
  - Codex 직접 실행: `git status --short`, `git diff --stat`, `git diff -- frontend/src`, 관련 파일 읽기/검색, 설치된 Playwright 번들 발췌, `git diff --check` — 공백 오류 없음.
- review: 실행 결과 원문 로그를 독립 재검증한 것은 아님. e2e 실패 판정은 실제 실행 결과가 아니라 설치된 Playwright의 enabled/actionability 구현으로 확인한 정적 결함.
- skipped_with_reason:
  - e2e: not_run — 사용자 명시 실행 지시 없음.
  - lint/unit/build/budget 재실행: not_run — 전달 evidence를 이용하는 리뷰 범위이며 앱 코드 변경 없음.
  - 별도 typecheck: not_run — 독립 결과 미제공; build 성공과 별도 typecheck 성공을 동일시하지 않음.
  - 브라우저/스크린리더 실동작, 실제 네트워크 요청 계수: not_run — 이번 정적 검토 범위 밖.
- Evidence Gate: 제공된 기본 실행 evidence는 존재하나 변경된 e2e의 정적 결함 및 AC/구조 미충족으로 최종 승인 불가.

## Findings (심각도 · 파일:라인 · 근거 · 수정 제안)

### F1 — P1: 새 e2e 기대값과 클릭이 aria-disabled 계약에 모순됨
- 파일: `frontend/src/e2e/course/course-new.spec.ts:180` (관련: 181–183).
- 근거: `toBeEnabled()` 다음에 `aria-disabled="true"`를 요구한다. 설치된 Playwright의 `getAriaDisabled`는 네이티브 disabled 또는 명시적 aria-disabled를 검사하고, enabled 상태는 그 부정이다. 따라서 정상적인 소진 상태에서도 180행 assertion이 실패한다. assertion만 수정해도 일반 `locator.click()`은 enabled actionability를 기다리므로 183행에서 진행하지 못한다.
- 영향: 의도한 기능이 정상이어도 수정된 e2e가 통과하지 못하고 뒤의 토스트/라우트 검증에 도달하지 않는다.
- 수정 제안: `toHaveJSProperty("disabled", false)`와 aria-disabled 속성을 별도로 검증한다. 포커스 후 `press("Enter")`/Space로 네이티브 키보드 활성화를 검증하고, 포인터 동작은 이 계약에 한해 `click({ force: true })`로 enabled 검사를 우회한다. 일반 enabled assertion으로 되돌리지 않는다.

### F2 — P2: 빈 결과 + 소진에서 상단 ‘다른 코스 보기’는 여전히 클릭/포커스 불가
- 파일: `frontend/src/widgets/course-result/CourseResultScreen.tsx:139`.
- 근거: 상단 버튼은 빈 결과에서도 렌더되며 `disabled={rerolling || isEmpty}`가 적용된다. `isEmpty=true`, `retryExhausted=true`, `rerolling=false`이면 aria-disabled와 네이티브 disabled가 동시에 설정되어 안내 클릭/탭 포커스를 차단한다. 별도의 EmptyResult 버튼은 정상적으로 수정됐지만, AC의 ‘remainingRetries가 0일 때 다른 코스 보기 버튼은 클릭·포커스 가능’ 조건에는 빈 결과 예외가 없다.
- 영향: 같은 화면에서 동일 재추천 액션의 상단 버튼만 안내를 받을 수 없다.
- 수정 제안: 상단 버튼에서도 `isEmpty`를 네이티브 disabled 조건에서 제거하고 진행 중에만 비활성화한다. 빈 후보는 재추천을 차단할 이유가 아니며, 핸들러는 이미 해당 경로를 지원한다.

### F3 — P2: 위젯 handleReroll에 재추천 이벤트 정책이 남음
- 파일: `frontend/src/widgets/course-result/CourseResultScreen.tsx:65` (관련: 57, 70–78).
- 근거: 새 `retryExhausted` 분기는 단순 표시가 아니라 선택 초기화와 transition 실행 여부를 결정한다. 위젯이 `useTransition`, 진행 중 가드, `reset()`, 콜백 실행 순서를 소유한다. client-logic-separation의 허용 범위(분리된 상태/핸들러 JSX 바인딩) 및 course-result 도메인의 재추천/선택 정책 소유 제한에 해당한다. 서버 잔여 횟수 판정을 controller로 옮긴 것만으로 이 정책 분리는 완료되지 않는다.
- 영향: 소진 정책이 controller의 요청 차단과 위젯의 선택 보존으로 나뉘어 변경/테스트 시 계약이 어긋날 수 있다.
- 수정 제안: `features/course-result/hooks`의 결과 화면 액션 훅에 선택 상태와 재추천 transition/가드/선택 보존 정책을 모으고 위젯은 반환된 핸들러와 상태만 바인딩한다. 라우팅/안내 문구 owner는 SDD가 지정한 flow controller에 유지한다. 기존 flow controller 전체 이전이나 무관한 대규모 리팩터링은 요구하지 않는다.

## Acceptance Criteria 및 엣지케이스 검토
- 일반 결과 + 소진: controller 205–207행에서 show 후 return. 위젯 70–72행에서 reset/transition을 건너뜀. 따라서 이 클릭 경로에서 loading 전환/retry API/선택 초기화가 없는 것을 정적으로 확인.
- 남은 횟수 1 이상: 기존 reset → transition → loading route 흐름 유지.
- remainingRetries undefined: `!= null` 조건으로 소진 아님. 기존처럼 재추천 허용; 서버 응답/복원으로 숫자가 확정되기 전 소진을 추정하지 않음.
- 빈 결과: EmptyResult의 재시도 버튼은 진행 중에만 disabled이므로 기존 항상 비활성 결함은 해결. 소진 시 같은 안내 핸들러 사용. 상단 버튼 문제는 F2.
- rerolling 중: 두 버튼의 네이티브 disabled 및 핸들러 가드 존재. 소진과 진행 중이 동시에 참이어도 진행 중 비활성은 AC가 요구하므로 혼용 자체는 결함 아님.
- 빠른 연속 클릭: 소진 경로는 매번 show 후 return하므로 API/route 없음. useToast는 기존 타이머를 해제하고 다시 예약하여 토스트 누적 없이 갱신. 비소진 경로는 기존 transition pending 가드 유지; 실제 빠른 입력 및 동시 호출은 실행 검증하지 않았으며 신규 중복 요청 버그로 단정하지 않음.
- 진입 토스트: previousRemainingRetries가 0으로 기록된 후 클릭해도 effect가 재안내하지 않음. show가 동일 토스트 슬롯/타이머를 교체하므로 일반적인 진입 후 클릭에서 이전 문구가 클릭 문구를 덮어쓰는 경로는 보이지 않음. hydration/입력 시점 경쟁은 미실행.
- 접근성: Button은 네이티브 button이며 aria-disabled만으로 DOM 클릭/포커스를 막지 않음. Toast는 `role="status"`, `aria-live="polite"` 보유. 토스트가 메시지와 함께 조건부 마운트되므로 모든 보조기기에서 첫 알림이 읽힌다고 보증할 수는 없음. 지속적인 live region과 메시지 업데이트 패턴 및 실제 AT 확인을 후속 권장하되 이번 diff의 확정 회귀로 분류하지 않음.
- 공용 UI: 기존 Button/Toast/useToast 재사용, API 수정 없음. 추가 동기 연산은 단순 조건과 토스트 갱신이며 별도 성능 회귀 근거 없음.

## 단위 테스트 제안 (작성하지 않음)
- `frontend/src/widgets/situation/hooks/useSituationFlowController.test.ts`: remainingRetries 0/음수에서 안내 문구 및 router.push 0회, 1/undefined에서 loading route, 진입 안내 후 클릭 안내 교체. 기존 테스트 구성에 맞춰 의존 훅/라우터를 대체.
- `frontend/src/features/course-result/test/course-result-actions.test.ts`: F3에서 분리할 실제 액션 훅 계약을 검증. 소진 시 선택 보존/콜백 위임, 비소진 시 초기화, pending 시 무동작, 연속 입력 확인. 구현 세부 호출만 복제하는 테스트보다 관찰 가능한 선택/요청 결과를 우선.
- `frontend/src/widgets/course-result/CourseResultScreen.test.tsx`: 빈/비어 있지 않은 후보 × 소진/비소진 버튼의 네이티브 disabled/aria-disabled/포커스 계약과 Enter/Space 활성화. pending 시 비활성도 포함. 기존 테스트 환경이 DOM을 지원하는지 먼저 확인하고 불필요한 의존성 추가는 피할 것.
- e2e 수정 시 클릭 전 장소를 선택해 선택 보존을 검사하고 retry 요청 계수를 검사할 것. 현재 목록 텍스트 동일 assertion만으로 선택 초기화/API 무호출을 증명할 수 없으며, result URL의 즉시 poll 성공도 이후 전환 부재까지 증명하지 않음.

## Failure / Retry (실패 / 재시도)
- failure_stage: Validate
- failure_reason: implementation_bug (F1, F2), doc_mismatch (F3)
- retry_decision: F1–F3 수정 후 재검토. 이번 세션에서 구현 재시도 없음.
- guardrail_flags: network_restricted; 소스/테스트 수정 없음, Claude 호출 없음, e2e 실행 없음.
- 문서/요청 충돌 및 사용자 확인: 사용자 지시를 우선하여 리뷰와 지정 run log만 작성. 추가 확인 필요 없음.
- 남은 문서 불일치: F3의 UI 정책 혼입. 기존 course-result 도메인의 ‘후보가 있어야 결과 렌더’/sessionStorage 금지 서술은 실제 빈 화면/후보 복원 훅과 이미 어긋남; 이번 사용자 AC를 기준으로 검토했으며 기존 문서는 변경하지 않음.

## Next Action (다음 액션)
- 구현 owner가 F1–F3 수정 및 위 회귀 테스트를 검토한 뒤 validation에 재전달.
- e2e 실행은 사용자 명시 지시 시 수행.
- SDD에 적힌 BFF 한도 초과 오류 매핑은 기존 범위 밖 후속으로 유지.
- 수정한 문서: 이 run log만 신규 작성. 앱 코드와 테스트는 변경하지 않음.

---

## Round 2 — 재검증 및 단위 테스트 작성

### Meta (기본 정보)
- task_id: 2026-10-05-retry-limit-notice
- date: 2026-10-05
- task_type: 검증 + 단위 테스트 작성 (방식 A, 경로 지정)
- owners: Codex TestAgent / ValidationAgent; Claude는 기존 수정/evidence 제공 owner이며 재호출하지 않음.
- intent_source: 기존 SDD/Execution Spec 및 사용자 라운드 2 요청. AC 변경 없음.
- loop_type: full_loop의 test/validation/report
- iterations: 2 (두 번째 리뷰 라운드; 이번 테스트 수정/실행 1회)
- decision: approved_with_notes (사용자 표기: approve-with-notes). 라운드 1의 rejected를 대체하는 최신 판정.

### Documents Loaded (읽은 문서)
- 라운드 1에서 읽은 SDD/AC, validation, client-logic-separation, accessibility, domain, harness 및 report 규칙을 재사용.
- 추가: `.agents/agents/test.md` — 테스트만 작성, 기존 환경/컨벤션 준수, e2e 미실행 적용.
- `vitest.config.ts`, `features/course-result/test/restored-course-candidates.test.ts`, `widgets/situation/hooks/useSituationStepGuideVisibility.test.ts`, `features/faq/test/contact-form.test.tsx` — Node 단위 프로젝트와 기존 mock/테스트 배치 확인.
- 구현 파일 직접 확인: `useCourseReroll.ts`, course-result `index.ts`, `CourseResultScreen.tsx`, `course-new.spec.ts`, `useSituationFlowController.ts`의 소진/진입 안내 분기. 작업 상태는 `git status --short`로 확인.
- guide trigger: 훅/이벤트 정책은 client-logic-separation, disabled/키보드 변경은 accessibility. 공용 UI/API/서버 구현 변경 없음; 상세 BFF/Storybook 확장 검토 제외.

### Current Stage / Stages Visited (실행 단계)
- current_stage: Report 완료.
- Intent Capture: 사용자 지정 테스트 범위와 앱 코드 수정 금지 확인.
- Context Load: 기존 기준 문서와 수정 파일/테스트 설정 확인.
- Plan and Boundary Decision: 앱 코드는 읽기만 수행. 신규 의존성/설정 변경 없이 Node 단위 테스트의 기존 React 의존성 mock 방식을 적용.
- Implement: `frontend/src/features/course-result/test/use-course-reroll.test.ts` 신규 작성.
- Self Check: 테스트가 실제 useCourseReroll을 호출하고 callback/reset 계약을 검증하는지 확인.
- Evidence Run: 신규 테스트 파일만 지정 실행, 5/5 통과.
- Validate: F1–F3 해소, 비차단 검증 공백 N1 기록.
- Report: 기존 로그를 보존하고 라운드 2 추가.

### F1–F3 재판정
- F1 해소 — `frontend/src/e2e/course/course-new.spec.ts:182`: 네이티브 disabled 속성 부재와 aria-disabled를 따로 검증. 185–186행 focus + Enter는 Playwright click의 enabled actionability 검사를 요구하지 않으므로 기존 모순 해소. 실제 e2e 실행 통과를 주장하는 것은 아님.
- F2 해소 — `frontend/src/widgets/course-result/CourseResultScreen.tsx:124`, `:215`: 상단/빈 결과 버튼 모두 disabled 조건이 rerolling뿐임. 빈 결과+소진에서도 진행 중이 아니라면 클릭/포커스 가능하고 안내 핸들러로 연결됨.
- F3 해소 — `frontend/src/features/course-result/hooks/useCourseReroll.ts:21`, `frontend/src/widgets/course-result/CourseResultScreen.tsx:60`: 진행 중 가드, 소진 시 선택 보존/위임, 비소진 초기화/transition을 feature 훅이 소유. 위젯은 훅 반환 상태/핸들러를 바인딩. 기존 handleComplete는 이번 재추천 변경으로 추가된 정책이 아니므로 F3의 미해결로 확대하지 않음.
- controller 분기는 정적 확인: remainingRetries 0이면 안내 show 후 return하여 router.push에 도달하지 않음. 1이면 requestId/retryKey를 포함한 loading 경로로 이동. undefined는 기존처럼 비소진 처리. Toast/UI 재사용 및 진입 안내 동작은 라운드 1 검토와 동일.

### 작성한 테스트와 검증 범위
- 신규 파일: `frontend/src/features/course-result/test/use-course-reroll.test.ts`.
- 5개 사례:
  1. 소진 시 resetSelection 0회, onReroll 1회, transition 0회.
  2. 비소진 시 resetSelection과 onReroll 각 1회 및 초기화 선행, transition 1회.
  3. 진행 중 + 비소진에서 반복 호출해도 reset/onReroll/transition 모두 0회.
  4. 진행 중 + 소진에서 동일하게 무동작.
  5. 소진 상태 연속 3회 클릭에서 선택 초기화 없이 클릭마다 위임.
- 환경: 일반 unit 프로젝트는 `environment: node`. browser 프로젝트는 Storybook 전용. 같은 슬라이스의 기존 테스트처럼 React 경계를 mock하고 실제 훅을 호출함. `useTransition` pending 값을 주입하므로 실제 React 렌더/transition 스케줄링, 비소진 연속 입력의 경합, DOM 버튼 계약까지 증명하지는 않음.
- controller 테스트 생략: 기존 해당 controller harness가 없으며 Next router/searchParams, 후보 복원, generation, quiz, toast, step guide 의존성을 함께 대체해야 함. Node 환경에서 실제 effect/토스트/라우트 통합 검증을 하려면 테스트 준비 코드가 크게 늘어남. 사용자가 허용한 비용 예외를 적용해 정적 분기 확인으로 한정; 자동 테스트 통과로 표시하지 않음.

### Evidence Summary / Gate (증거 요약)
- evidence_bundle: Validation Bundle + 대상 단위 테스트.
- Codex 직접 실행: `npm run test:unit -- src/features/course-result/test/use-course-reroll.test.ts` (frontend cwd).
  - exit code: 0
  - Test Files: 1 passed (1)
  - Tests: 5 passed (5)
  - Vitest: 4.1.10, duration 99ms
- Codex 직접 실행: `git diff --check` — 공백 오류 없음.
- 사용자 제공 Claude evidence: tsc OK, lint 0 errors, build OK, route bundle budget OK. 이번 세션에서 재실행하지 않음.
- 사용자 제공 전체 unit evidence: 589 pass / 2 fail. 실패는 `features/faq/test/contact-form.test.tsx` timeout이며 변경을 stash한 baseline에서도 동일 실패를 확인했다는 전달 내용. Codex가 baseline을 직접 재현한 것은 아님. 전체 suite 성공으로 기록하지 않으며 이번 변경의 회귀 근거로도 사용하지 않음.
- skipped_with_reason: e2e not_run(명시 실행 지시 없음), 전체 suite/typecheck/lint/build/budget 재실행 not_run(대상 테스트만 실행하도록 요청), controller 단위 테스트 not_written(위 비용 사유).
- Evidence Gate: 수정된 재추천 훅의 요청된 계약은 통과. 전체 suite/브라우저 통합은 위 제한을 남기고 approved_with_notes.

### 남은 Finding
- N1 — P3 / 비차단 테스트 보완: `frontend/src/e2e/course/course-new.spec.ts:184` (관련 190–195행).
  - 근거: 현재 검증은 목록 텍스트 보존과 result URL 확인이며, 클릭 전에 선택하지 않으므로 선택 보존을 검증하지 않고 retry 네트워크 요청 계수도 검사하지 않음. 즉시 성공하는 URL poll만으로 뒤늦은 전환까지 배제할 수도 없음.
  - 수정 제안: 후속 e2e에서 클릭 전 선택을 만들고 선택 상태/순서를 확인하며 retry 요청을 관측해 소진 클릭 후 증가하지 않음을 검사할 것. 신규 훅 단위 테스트는 선택 초기화 금지를 보완하지만 controller/네트워크 통합 검증의 대체는 아님.
  - 반영 판단: 후속 보완 필요, 현재 승인 차단은 아님. ‘사용자 지시 전 e2e 미실행’은 실행 제한이므로 기대값 보완 필요 여부와 별개다. 이번 요청은 필요성 판단만 요구하므로 e2e 파일을 수정하거나 실행하지 않음.
- 새 승인 차단 finding 없음. 기존 FAQ timeout과 라운드 1의 AT 실동작/BFF 후속/도메인 문서 불일치는 이번 범위 밖 관측 사항으로 유지.

### Failure / Retry (실패 / 재시도)
- failure_stage: none (라운드 2 대상 테스트/재검증)
- failure_reason: none (N1은 비차단 검증 보완 note; FAQ test_failure는 제공된 기존 baseline 이슈)
- retry_decision: 추가 구현 재시도 불필요. 후속 통합 검증 보완 시 재확인.
- guardrail_flags: network_restricted; 앱 코드 수정 없음, 신규 의존성 없음, Claude 호출 없음, e2e 실행 없음.
- 문서/요청 충돌: 없음. 기존 가이드 범위와 사용자 지시에 따라 테스트와 run log만 수정.
- 사용자 확인: 추가 확인 필요 없음.
- 공용 UI 재사용: 기존 Button/Toast/useToast 유지; 이 라운드에서는 UI 구현 변경 없음.

### Next Action (다음 액션)
- N1의 선택 보존/요청 계수 e2e 보완을 후속 검토하고, 실행은 사용자 명시 지시 시 수행.
- 기존 FAQ timeout은 별도 flaky-test 작업에서 다룰 것.
- 수정 산출물: 신규 `use-course-reroll.test.ts`와 이 run log의 라운드 2만. 앱 구현/e2e/설정/기준 문서는 변경하지 않음.

## 라운드 2 이후 (Claude)
- P3 반영: e2e에서 소진 클릭 전 장소 1개 선택 → 안내 후 `aria-pressed=true` 유지, `/api/situations/:id/retry` 브라우저 요청 0회, step=result 유지를 검증하도록 보강. 이후 선택은 nth(1~3)만 추가.
- e2e 실행: `npx playwright test src/e2e/course/course-new.spec.ts` 1/1 pass (사용자 지시, 2026-10-05).
