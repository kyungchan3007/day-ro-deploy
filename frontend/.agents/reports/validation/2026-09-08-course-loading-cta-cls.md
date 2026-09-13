# Course Loading CTA CLS 검증 리포트

## 작업 일시 (실행 날짜)
- 2026-09-08 (Asia/Seoul)

## Intent Source (의도 출처)
- task_id: `2026-09-08-course-loading-cta-cls`
- intent artifact: 사용자 handoff의 변경 설명과 요청 1~3을 acceptance source로 사용했다. `.agents/intent/active/`에는 이 작업의 파일 기반 intent artifact가 없다(`intent_gap`). 기존 구현은 성능 및 shared 경계 변경을 포함하므로 저장소 규칙상 별도 intent가 필요한 규모다.

## 검증 대상 (대상 파일 / 범위)
- `src/widgets/situation/SituationLoadingScreen.tsx`
- `src/app/course/new/layout.tsx`
- `src/shared/observability/WebVitalsLogger.tsx`
- `src/shared/observability/index.ts`
- `src/widgets/home/HomeWebVitalsLogger.tsx`, `src/widgets/home/HomeScreen.tsx` (중복 및 승격 근거 비교)
- `src/e2e/course/course-loading-quiz.spec.ts`
- `src/e2e/course/course-new.spec.ts`

## 최종 결정 (판정 결과)
- `blocked`
- 정적 구조 리뷰, lint, typecheck, 관련 단위 테스트는 통과했다. 그러나 사용자가 필수로 요청한 두 e2e spec은 샌드박스의 로컬 포트 바인딩 차단으로 테스트 본문을 실행하지 못했으므로 Evidence Gate를 닫지 않았다.

## Acceptance Criteria 확인 (완료 조건 점검)
- CTA는 `ready`와 무관하게 처음부터 동일한 버튼 DOM/크기로 렌더되고, 준비 전에는 네이티브 `disabled`, 준비 후에는 enabled가 된다: 코드 리뷰로 충족.
- `ready` 계산과 결과 이동 정책은 기존 `useCourseGeneration` 및 `useSituationFlowController`에 남고 UI는 값/핸들러만 바인딩한다: 충족.
- `/course/new` layout은 Server Component로 유지되고 직렬화 가능한 `route` 문자열만 Client Component에 전달한다: 충족.
- Web Vitals 로거는 자체 개발 환경 가드와 layout의 개발 환경 가드를 모두 가지며 production 호출 시 no-op이다: 코드 리뷰 및 typecheck로 충족. production build 완료 증거는 외부 폰트 네트워크 차단으로 확보하지 못했다.
- `course-loading-quiz.spec.ts`가 AI 완료 이후 클릭 가능 상태를 기다린다: `toBeVisible()`을 `toBeEnabled()`로 수정해 충족.
- 최소 두 e2e spec 실행: 명령은 실행했으나 webServer 시작 전 `listen EPERM 127.0.0.1:18080`로 중단되어 미충족.

## 변경 파일 요약 (수정 범위)
- 테스트 수정: `course-loading-quiz.spec.ts`의 CTA readiness assertion 1건을 `toBeEnabled()`로 변경했다.
- 테스트 수정: 동일 계약을 직접 표현하도록 `course-new.spec.ts`의 초기 생성/재추천 CTA assertion 2건을 `toBeEnabled()`로 변경했다.
- 문서 추가: 본 validation report와 대응 run log를 추가했다.
- 제품 소스는 리뷰만 했고 수정하지 않았다. 커밋도 생성하지 않았다.

## 실행 루프 요약 (작업 흐름 요약)
- loop type: `Full Loop`
- iterations: 2 (테스트 assertion 보강 후 e2e 실행, 환경 차단 확인 후 lint/typecheck/unit/build 대체 증거 수집)
- handoff 사용 여부: yes — 사용자 메시지의 Claude(UI/UX owner) → Codex(로직/테스트/validation owner) handoff
- evidence bundle: `Validation Bundle` (구조 리뷰 + targeted lint + typecheck + 관련 unit + 필수 e2e 시도 + production build 시도)

## 실행한 검증 명령 (검증 커맨드)
- `git diff --check` → exit 0 (테스트 수정 직후)
- `npm run test:e2e -- src/e2e/course/course-loading-quiz.spec.ts src/e2e/course/course-new.spec.ts` → webServer 시작 실패, 테스트 0건 실행 (`listen EPERM 127.0.0.1:18080`)
- `curl http://127.0.0.1:3100/course/new`, `curl http://127.0.0.1:18080/__mock/stats` → 재사용 가능한 기존 서버 없음
- `npm run lint -- src/widgets/situation/SituationLoadingScreen.tsx src/app/course/new/layout.tsx src/shared/observability/WebVitalsLogger.tsx src/shared/observability/index.ts src/e2e/course/course-loading-quiz.spec.ts src/e2e/course/course-new.spec.ts` → exit 0
- `npx tsc --noEmit` → exit 0
- `npm run test:unit -- src/features/situation/test/course-generation.test.ts` → 1 file, 4 tests passed
- `npm run build` → Turbopack가 optimized production build 단계에서 2분 이상 무응답하여 중단(exit 130)
- `NEXT_TELEMETRY_DISABLED=1 npx next build --webpack` → 외부 네트워크 제한으로 `fonts.googleapis.com` 해석 실패; `Geist`, `Geist Mono` fetch 실패

## Evidence Gate (증거 통과 여부)
- intent artifact: `partial` — 사용자 handoff에 명확한 acceptance criteria는 있으나 repository intent artifact가 없다.
- tests: `partial` — 관련 unit 4/4 pass, 필수 e2e는 환경 차단으로 0건 실행.
- typecheck: `pass`
- build: `blocked` — 기본 Turbopack build 무응답, webpack 대체 build는 Google Fonts 네트워크 차단.
- additional review: `pass` — VSA, client logic separation, server/client import graph, barrel, accessibility, CLS 회귀를 수동 검토했다.
- skipped with reason: affected 전체 e2e는 동일 webServer 포트 바인딩 차단으로 실행 불가. 현재 `e2e-impact-map.json`의 situation mapping에는 `course-new.spec.ts`만 있어 `course-loading-quiz.spec.ts`가 affected 선택에서 누락되는 점도 확인했다.

## 구조 / VSA 검토 결과 (아키텍처 판단)
- `SituationLoadingScreen`: `disabled={!ready}`는 상태 정책 계산이 아니라 이미 계산된 view state의 JSX 바인딩이다. 생성 완료 판정은 `features/situation`의 model/hook과 widget controller가 계속 소유하므로 UI/로직 역할 누수는 없다. 변경은 순수 UI 표현 및 접근성 계약 범위다.
- CLS: 조건부 삽입을 고정 DOM의 enabled 상태 전이로 바꿔 버튼 공간을 최초 렌더부터 예약한다. `Button`의 크기 class는 상태에 따라 바뀌지 않고 disabled는 opacity/pointer-event만 바꾸므로 CTA 삽입으로 인한 기존 layout shift 원인을 제거한다.
- 접근성: 공용 `Button`이 `ButtonHTMLAttributes<HTMLButtonElement>`를 확장하고 props를 네이티브 `<button>`에 전달하므로 HTML `disabled` 상태가 접근성 트리와 키보드에 전달된다. 별도 `aria-disabled` 중복은 필요 없다. 로딩 문구가 비활성 이유의 문맥도 제공한다.
- Server/Client: `course/new/layout.tsx`는 `use client`가 없는 Server Component로 유지된다. Client Component인 로거에 전달되는 prop은 문자열 하나뿐이며 직렬화 문제가 없다. 서버 전용 import가 client graph에 연결되지 않는다. 서버 layout에서 작은 client leaf를 렌더하는 패턴은 규칙에 맞는다.
- Client logic separation: `WebVitalsLogger`는 markup을 조합하는 UI가 아니라 effect-only observability adapter이며 `null`을 반환한다. 화면 UI 파일에 state/effect/browser policy를 섞지 않아 가이드 취지에 부합한다.
- 배럴/import: app이 `@/shared/observability` public entry를 사용하고, 배럴은 client-safe component/type만 export하며 `export type`도 분리돼 있다. `shared`가 feature를 import하지 않아 import 방향도 정상이다. 배럴 규모가 작아 현재 bundle 리스크는 낮다.
- shared 승격/중복: 현재 실제 사용처는 `/course/new` 하나이고 홈은 `HomeWebVitalsLogger`를 계속 사용한다. 따라서 “둘 이상의 슬라이스에서 실제 재사용”이라는 shared 승격 기준은 현 상태만으로는 충족하지 못한다. 두 로거는 같은 `web-vitals/attribution` 구독/console payload를 중복 구현하면서 `route` 및 `reportAllChanges` 동작도 달라질 수 있다. 홈을 `<WebVitalsLogger route="home" />`로 교체하고 `HomeWebVitalsLogger.tsx`를 제거해 shared 승격 근거와 동작을 동시에 정리하는 것을 권고한다. 서로 다른 route에서만 마운트되므로 현재 동시 중복 구독 회귀는 없다.
- layout 위치: query step 전환 동안 segment layout이 유지되므로 `/course/new` 전체 INP/CLS 세션을 관측하려는 목적에 적합하다. 전역 root layout보다 범위가 좁아 불필요한 전체 사이트 client 계측도 피한다.

## Failure Taxonomy 또는 미검증 항목 (실패 분류 / 미검증)
- `external_blocker`: 샌드박스가 mock backend의 `127.0.0.1:18080` listen을 `EPERM`으로 거부해 Playwright webServer가 시작되지 않았다.
- `missing_evidence`: 필수 e2e 두 spec의 테스트 본문이 실행되지 않았고 production build도 완료 증거를 확보하지 못했다.
- `intent_gap`: 성능/shared 경계 변경 규모에 필요한 repository intent artifact가 active/archive에 없다.
- `boundary_conflict` (non-blocking source note): shared 로거가 아직 실제 2개 슬라이스에서 재사용되지 않아 shared 승격 근거가 미완성이다.
- `doc_mismatch` (test infrastructure): situation 영향 매핑이 `course-loading-quiz.spec.ts`를 포함하지 않아 affected runner만으로는 이 회귀 테스트를 선택하지 못한다.

## 남은 리스크 및 후속 작업 (후속 조치)
- 로컬 포트 바인딩이 가능한 환경에서 수정된 두 e2e spec을 동일 명령으로 재실행하고 3개 test 결과를 확인해야 `approved` 판정이 가능하다.
- 홈을 shared 로거로 통합하고 기존 홈 전용 구현을 제거하는 정리를 권고한다. 통합 시 홈의 `reportAllChanges` 의미 변화가 의도된 것인지 확인한다.
- `e2e-impact-map.json`의 `course-new-situation-flow.specs`에 `src/e2e/course/course-loading-quiz.spec.ts`를 추가해 affected 실행 누락을 막는 후속을 권고한다.
- 네트워크 가능한 환경에서 `npm run build`를 재실행해 production tree-shaking/route build까지 확인한다.

## 애드덤 (Claude, 2026-09-08 후속 — blocked 사유 해소)
Codex 리포트 이후 사용자 지시로 아래를 수행해 미결 항목을 해소했다.

- **e2e 재실행 (dev 머신, 포트 바인딩 가능 환경)** — `npx playwright test src/e2e/course/course-loading-quiz.spec.ts src/e2e/course/course-new.spec.ts src/e2e/home/home.spec.ts` → **4 passed (15.7s), exit 0**. (loading-quiz 2건 = CTA 유지 후 클릭 + 퀴즈 오답/정답/다음/건너뛰기, course-new 1건 = 3스텝 플로우, home 1건). `missing_evidence`/`external_blocker`(e2e 부분) 해소.
- **홈 계측 통합** — `HomeScreen`을 `<WebVitalsLogger route="home" />`로 교체하고 `src/widgets/home/HomeWebVitalsLogger.tsx` 제거. 이제 shared 로거가 home·course/new **2곳 재사용** → `boundary_conflict`(shared 승격 근거) 해소. tsc/eslint 통과.
- **intent artifact 생성** — `intent/prd|sdd|tasks/2026-09-08-course-loading-cls-vitals.md` 3종 작성 → `intent_gap` 해소.

**남은 항목(비차단):**
- `doc_mismatch`: `e2e-impact-map.json`에 `course-loading-quiz.spec.ts` 추가 필요(affected 누락 방지) — 후속.
- `build`: 네트워크 가능 환경에서 `npm run build` 재확인 — 후속(폰트 fetch).

**실효 판정:** Evidence Gate의 e2e·intent·shared-boundary 항목 해소. production build 재확인만 남음.

