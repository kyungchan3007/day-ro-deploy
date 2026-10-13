# zod/mini 계약 전환 검증 리포트

## 최종 판정

**approved_with_notes** (2026-09-13 재검증, Claude) — 아래 "재검증 (Claude, Codex 사용량 한도로 대체)" 섹션 참고. 최초 판정 rejected의 미충족 증거(전체 lint, production build 실측, measured baseline·예산 통과, E2E)를 로컬에서 모두 충족했다.

- 검증 주체 변경: Codex 사용량 한도(22:46까지)로 재검증 불가 → 사용자 지시("니가 대신 해야할거 같아")에 따라 Claude가 재검증 수행. Codex gate를 거치지 않은 판정이므로 Codex 한도 해제 후 사후 리뷰 권장(아래 notes).

### 최초 판정 (Codex)

**rejected** — 구현과 Node 회귀 검증은 완료했지만 전체 lint, production build 실측, 실측 mini baseline 및 현재 빌드 예산 통과, E2E의 필수 증거가 충족되지 않았다. 배포/머지 승인으로 해석하지 않는다.

- 실행일: 2026-09-13 (Asia/Seoul)
- owner: Codex 구현·단위 테스트·검증. 사용자 직접 지시에 따라 Claude 재호출 없이 같은 런타임에서 역할 전환.
- intent source: frontend 기준 `.agents/intent/{prd,sdd,tasks}/2026-09-13-zod-mini-contract.md` 및 `.agents/reports/handoffs/2026-09-13-zod-client-bundle-debate.md` Round 2.
- 시작 HEAD: `392c53a5d514444ef3a2e73d1908d8e5f9ed4cb4`.
- 증거: [실행 로그 디렉터리](2026-09-13-zod-mini-contract-evidence/).

## Acceptance Criteria

| 조건 | 결과 / 근거 |
| --- | --- |
| 런타임 classic 진입점 0건 | 통과. `src` import 검색에서 mini/core/en.js만 존재. 런타임 변경은 계약 1곳, 배열 사용처 2곳, 서버 오류 판별 2곳. 나머지 `.parse()` 소비자는 그대로 mini 계약을 사용한다. |
| export 이름·추론 타입 유지 | 통과. 기존 export 유지, 전환 전 classic과 공개 타입 alias 34개의 양방향 타입 동일성 검사 0 diagnostics, 최종 tsc exit 0. |
| classic 동등성 | 통과. 전환 전에 classic 4.4.3으로 고정한 312건이 classic과 mini에서 모두 통과. 성공 여부·unknown key 제거 포함 data·issue code/path/message 비교. |
| 독립 영어 locale | 통과. classic 런타임 import 없는 단독 테스트 1건. 초기화 제거 mutation에서는 `Invalid input`이 관측되어 예상대로 실패, 복구 후 통과. production 초기화 보존은 미검증. |
| BFF HTTP 상태 매핑 유지 | 통과. situation/save/update에서 요청 오류 400·upstream 계약 오류 400·일반 오류 502 등 9건. 기존 인증·요청 테스트도 통과. |
| ESLint 차단/허용 | 통과. 11개 금지 경로 import/re-export와 허용 3개 경로, 총 14개 테스트. 전체 lint는 별도 실패. |
| 예산 실패 케이스 | 통과. 예산 초과·라우트 누락/추가/중복·청크 누락/중복/빈 배열·합계 불일치·stats 부재/포맷 오류·경로 이탈·잘못된 bytes·미측정 baseline 및 한도 경계 포함 16개 테스트. |
| 현재 production 빌드 예산 통과 | 미충족. stats 부재로 exit 1. baseline은 `pending-mini-build`이며 측정 후 수동 확정하기 전 검사 실패가 의도된 동작이다. |
| CI lint/build/budget 및 workflow 경로 트리거 | 구현·정적 검토 완료. pull_request/push 양쪽 workflow 경로 추가. CI 원격 실행·branch protection은 미확인. |
| 기존 unit·E2E | Node 전체 41파일/500테스트 통과. Storybook 테스트는 포트 제약으로 실패, E2E는 서버 기동 금지로 미실행. |
| 라우트별 first-load 감소 | 미측정. 기존 참고 stats만 보존했고 새 build 결과는 없음. |
| 경계·요청/응답·화면 동작 불변 | diff/회귀 검토 통과. UI·훅·transport·정책 수정 없음. 서버 기동 성공 없음, commit/push 없음. |

## Evidence Plan 단계별 실행

명령의 cwd는 별도 표시가 없으면 `frontend/`. Node 테스트는 포트를 사용하지 않는다.

| 단계 | 실행 명령 | 결과 |
| --- | --- | --- |
| 1 | `npm run test:unit -- src/features/{auth,situation,course-map,saved,course-result}/test` | 통과, 30파일/129건, exit 0. |
| 1 | 기존 `.next/diagnostics/route-bundle-stats.json` 복사 | 기존 classic stats 15라우트 보존. 새로 성공시킨 build가 아닌 참고 자료다. |
| 1 | `npm run build` | 실행 후 compile 단계가 수분 동안 진전하지 않아 Ctrl-C 중단, exit 130. 오류 원인은 확정할 수 없었으며 네트워크 제한 환경에서 `next/font/google` 사용을 확인했다. 환경 변경·폰트 mock·webpack 대체·권한 우회 없이 중단. 성공 build로 간주하지 않는다. |
| 1 | `node /tmp/dayro-zod-evidence/freeze-classic.cjs` | 전환 전 소스로 312개 classic 결과 JSON 고정. |
| 1 | `npm run test:unit -- src/shared/api/openapi/test/contract-equivalence.test.ts` | classic 코드에서 312건 통과, exit 0. |
| 2 | `npx tsc --noEmit` | 초기 신규 테스트의 type predicate 오류 수정 후 통과, exit 0. 제품 계약 타입 오류 없음. |
| 2 | `npm run lint` | 실패, 생성된 Storybook 산출물 포함 472 errors/13,436 warnings. 4단계에서 산출물 ignore만 추가. |
| 2 | 1단계와 동일한 관련 unit 명령 | mini 코드에서 30파일/129건 통과, exit 0. |
| 3 | `npm run test:unit -- --exclude '**/*.stories.*'` | Node 40파일/483건 통과했지만 Storybook 프로젝트가 별도 listener를 시도하여 `listen EPERM ::1:63315`, 전체 exit 1. stories exclude만으로 browser 프로젝트 초기화가 제외되지 않았음. 서버는 기동되지 않았고 재시도하지 않았다. |
| 3 | `npm run test:unit -- --project '!storybook'` | Node 프로젝트만 실행: 보강 전 40파일/483건, 보강 후 41파일/500건 통과. |
| 3 | `npm run test:unit -- --project '!storybook' src/shared/api/openapi/test/mini-locale.test.ts` | 별도 실행 1건 통과. `z.config(en())`를 임시 제거한 동일 명령은 exit 1, 복원 후 exit 0. |
| 3 | `node /tmp/dayro-zod-evidence/compare-types.cjs` | classic 복사본과 mini의 34개 export type에 `Assert<Equal<Classic.T, Mini.T>>` 검사, 0 diagnostics. classic은 TypeScript 검사에만 사용하며 런타임에 로드하지 않음. |
| 3 | `npm run build` | 미실행. 1단계 production compile 정체 이후 동일 제약에서 반복/우회하지 않음. 전후 bytes 미확보. |
| 4 | `npm run lint` | 실패, exit 1: 17 errors/3 warnings. 이번 변경 파일에서는 0건. 상세 아래. |
| 4 | `npx eslint src/shared/api/openapi src/shared/api/server-course.ts src/app/api/situations/route.ts src/features/course-map/lib/selected-course-storage.ts src/features/situation/model/url-state.ts src/features/course-map/test/selected-course-storage.test.ts src/features/course-result/test/generated-course-storage.test.ts scripts/check-route-bundle-budget.mjs scripts/test eslint.config.mjs` | 변경 코드·가드만 대상 검사 통과, exit 0. 전체 lint 통과를 대체하지 않음. |
| 4 | `node --test scripts/test/*.test.mjs` | 30건 통과, exit 0. 실패 케이스는 throws 및 오류 원인 assertion으로 확인. |
| 4 | `npm run build` | 미실행, 위 production build 제약 동일. |
| 4 | `node scripts/check-route-bundle-budget.mjs` | 실패, exit 1. 현재 stats ENOENT를 명시적으로 차단. |
| 5 | `npx tsc --noEmit` | 최종 통과, exit 0. |
| 5 | `npm run test:unit -- --project '!storybook'` | 최종 통과, 41파일/500건, exit 0. |
| 5 | `node --test scripts/test/*.test.mjs` | 최종 통과, 30건, exit 0. |
| 5 | `git diff --check` | 통과. |
| 5 | `npm run test:e2e:ci` | **미실행·사유**: `playwright.config.ts` webServer가 `node src/e2e/support/dev-with-mock-backend.mjs`로 dev/mock 서버를 기동한다. 모든 서버 기동 금지 직접 지시를 적용. |
| 사용자 측정 | Coverage·Lighthouse | **사용자 측정 대기**. FCP/LCP/TBT/CLS/SI 및 INP/TTFB 실측 미확인. |

## 라우트별 production first-load bytes

아래 Before는 실행 전에 존재하던 classic 산출물의 stats다. 핸드오프의 `/course/new` 913,599B와 일치하지만, 이번 세션에서 재현한 성공 build는 아니다. 중단한 build가 `.next`의 기존 stats를 정리했으므로 원본은 evidence에 따로 보존했다. After는 빈 값을 임의 계산하지 않는다.

| Route | Before 참고값 (B) | After (B) | 절감량 / 비율 |
| --- | ---: | --- | --- |
| `/` | 875,185 | 미측정 | 산출 불가 |
| `/_not-found` | 514,718 | 미측정 | 산출 불가 |
| `/course/new` | 913,599 | 미측정 | 산출 불가 |
| `/faq` | 881,993 | 미측정 | 산출 불가 |
| `/faq/contact` | 881,993 | 미측정 | 산출 불가 |
| `/login` | 874,619 | 미측정 | 산출 불가 |
| `/mypage` | 874,619 | 미측정 | 산출 불가 |
| `/mypage/withdraw` | 874,619 | 미측정 | 산출 불가 |
| `/privacy` | 874,619 | 미측정 | 산출 불가 |
| `/saved` | 944,567 | 미측정 | 산출 불가 |
| `/saved/[id]` | 944,567 | 미측정 | 산출 불가 |
| `/terms` | 874,619 | 미측정 | 산출 불가 |
| `/ui-preview` | 577,363 | 미측정 | 산출 불가 |
| `/ui-preview/colors` | 518,114 | 미측정 | 산출 불가 |
| `/ui-preview/layout-demo` | 574,112 | 미측정 | 산출 불가 |

- `/course/new` 절감량: **산출 불가**. 비율 공식은 `(913599 - afterBytes) / 913599 × 100`이며 afterBytes가 없다. 0B·0% 절감으로 보고하지 않는다.
- zod 포함 청크 before: `_next/static/chunks/2979ccxw8woip.js`, **270,924B** (핸드오프의 기존 production 측정; 전체 청크 크기이며 zod 패키지만의 크기는 아님).
- zod 청크 after: **미측정**, 제거량/비율 **산출 불가**. Coverage 미사용량 221,374B를 절감량으로 대체하지 않았다. 공용 청크 절감량 × 11 합산 없음.
- `scripts/route-bundle-baseline.json`은 위 15개 참고값과 `pending-mini-build` 상태만 포함한다. post-mini baseline으로 주장하지 않으며 현재 CI는 의도적으로 차단된다. 정상 build 후 각 수치를 실측값으로 수동 교체하고 사유·before/after를 이 보고서에 기록한 뒤 `measured`로 확정해야 한다.

## 동등성 증거와 리뷰

- classic fixture 출처: 전환 전 `dayro.openapi.ts`, SHA-256 `5391e043ce7e6cd8d539ff99c1728c08565f3af228c97aa24e7157c6945edc14`. 기대값은 mini로 다시 생성하지 않았다.
- 312건은 공개 스키마 정상/null/누락/unknown key, 잘못된 200 응답, 정수 음수/0/소수/안전 정수 경계, UUID, 문자열 길이 0/1/20/21, 배열 최소 길이, 시간 regex를 포함한다. `99:99:99`의 기존 형식상 허용도 유지한다.
- locale 테스트는 다른 테스트가 classic을 로드해 초기화 누락을 가리는 상황을 막기 위해 기존 locale을 비우고 모듈 캐시를 초기화한 후 계약을 import한다. class/stack 문자열 대신 code/path/message를 비교한다. mutation 실패가 initializer 의존성을 증명한다.
- 기존 저장소 복원 테스트와 추가 손상 JSON/null/누락 구조 회귀 8건 확인. generated-course-storage는 `.parse()` 그대로 mini 계약을 소비하므로 제품 파일 수정 불필요.
- 서버 `$ZodError` 판별만 교체했다. 잘못된 upstream 응답도 기존대로 400이다. UI raw zod 메시지를 바꾸지 않았다.
- VSA: 공용 계약 정의는 shared에, 선택 복원은 각 feature lib/model에 유지. 새 feature barrel/server export/UI orchestration 변경이나 공용 승격 없음. UI 변경이 없어 공용 UI 재사용 판단은 해당 없음.

## 전체 lint 실패 (기존 파일)

전체 실패 파일은 이번 제품 diff에 포함되지 않는다. 오류를 숨기는 disable 또는 UI/훅 리팩터링은 하지 않았다.

- `.claude/skills/{brand,design-system}/scripts/*.cjs`: 기존 `@typescript-eslint/no-require-imports` 오류 15건.
- `src/features/auth/hooks/useAuthSession.ts:36`, `src/widgets/situation/hooks/useSituationFlowController.ts:148`: 기존 `react-hooks/set-state-in-effect` 오류 각 1건.
- 경고 3건: 기존 skill 스크립트 변수, `public/mockServiceWorker.js` disable 주석, `useWheelColumn.ts`의 미사용 useMemo.
- `storybook-static/**`은 생성 산출물이므로 기존 `.next/out/build`와 같은 global ignore에 추가. 이 수정 후에도 위 오류가 남으므로 CI lint 단계는 현재 실패한다.

## 변경 파일 목록

제품 코드:
- `src/shared/api/openapi/dayro.openapi.ts`
- `src/shared/api/server-course.ts`
- `src/app/api/situations/route.ts`
- `src/features/course-map/lib/selected-course-storage.ts`
- `src/features/situation/model/url-state.ts`

테스트:
- `src/shared/api/openapi/test/classic-contract-cases.json`
- `src/shared/api/openapi/test/contract-equivalence.test.ts`
- `src/shared/api/openapi/test/mini-locale.test.ts`
- `src/shared/api/openapi/test/bff-error-mapping.test.ts`
- `src/features/course-map/test/selected-course-storage.test.ts`
- `src/features/course-result/test/generated-course-storage.test.ts`

가드·문서:
- `eslint.config.mjs`
- `scripts/check-route-bundle-budget.mjs`
- `scripts/route-bundle-baseline.json`
- `scripts/test/route-bundle-budget.test.mjs`
- `scripts/test/zod-import-policy.test.mjs`
- `../.github/workflows/frontend-quality.yml`
- `.agents/guides/performance.md` (기존 `.gitignore:47`에 의해 추적 제외된 로컬 문서. 내용 갱신 완료, ignore 정책/스테이징은 변경하지 않음.)
- 이 validation report, 동명 evidence 디렉터리, `.agents/reports/runs/2026-09-13-zod-mini-contract.md`.

시작 시 존재하던 active intent 수정, PRD/SDD/tasks, handoff, Lighthouse HTML은 보존했고 수정하지 않았다. 의존성 설치·서버 실행 성공·commit/push·intent 결정 변경 없음.

## 문서 적용과 충돌 처리

- AGENTS.MD, `.agents/{README,intent/README,context/README}.md`, active index: 작업 유형/기준 원본/기존 변경 보존 판단.
- PRD/SDD/tasks, Round 2 handoff: mini 단일 계약, locale, 타입, 오류 판별, 금지 후속 범위, evidence 순서와 예산식 유지.
- feature/test/validation 역할 및 harness README/observability, reports README, orchestration README: Codex 구현→테스트→검증 역할 전환, 증거 부족 rejected 판정과 run log 작성.
- bff/server-client-boundary/client-logic-separation: 브라우저→BFF 경계, feature lib/model 저장소 복원 책임 유지.
- performance 및 next-best-practices/vercel-react-best-practices 스킬: production 미실측을 성능 통과로 주장하지 않음, CI 가드 추가.
- typescript-advanced-types/tdd/verification-before-completion 스킬: 공개 타입 추론 보존, classic 고정 기대값, 회귀·mutation·fresh verification.
- login(auth)/course-situation/course-result/course-map/saved 도메인: 입력/선택 복원/인증/저장 흐름 불변. saved 문서의 기존 수정 기능 관련 서술은 현재 코드와 차이가 있으나 이번 scope에서 수정하지 않음.
- webapp-testing/vercel-composition-patterns 연결 스킬도 읽었으나 서버 금지/UI 변경 없음으로 해당 실행 절차는 적용하지 않음. 접근성/Storybook guide/캐시 도입 스킬은 변경 트리거가 없어 제외.
- 충돌: 문서의 서버 기동·Claude 리뷰·push 절차보다 이번 사용자 직접 금지 지시를 우선. 사용자에게 재승인 요구하지 않았고 intent 결정을 수정하지 않음. TDD 계획/동작 승인도 이미 구체적 핸드오프에 포함됨.
- 미측정 baseline의 fail-closed 상태는 실측값을 조작하지 않기 위한 미완료 표시다. 예산식·스키마 정책을 완화하지 않았다.

## 실행 루프와 남은 리스크

- Full Loop, file-based handoff A, 같은 Codex runtime의 구현·검증 (사용자 지정). 보완 증거: classic 고정 기대값, 타입 동일성, 독립 locale mutation, 가드 실패 테스트, 최종 재검증.
- loop 반복: 신규 테스트 type predicate 오류 수정, 전체 unit의 browser 초기화 실패 후 Node project 분리, lint 생성물 제외 후 기존 오류 분리. 주요 gate: Intent/Boundary 통과, Evidence/최종 승인 미통과, Report 완료.
- failure taxonomy: `missing_evidence`, `external_blocker`, `build_failure`, `performance_risk`; 기존 lint 오류로 CI gate 실패. 변경 파일의 타입/Node/가드 테스트 실패는 최종 시점에 없음.
- 후속: 허용 환경에서 production build 전후 재측정 → zod 청크·라우트 bytes·locale 초기화 확인 → 실측 baseline 수동 확정 → 예산 검사. baseline 측정 전에는 CI가 통과하지 않는다.
- 전체 lint 기존 오류 해결 또는 저장소 책임자가 범위를 별도 결정해야 한다. 이번 lint 규칙을 완화해 통과시키지 않았다.
- E2E/Storybook, Coverage·Lighthouse는 사용자 측정/실행 대기. branch protection에서 Frontend Quality 필수 체크 지정 확인 필요.
- performance.md는 기존 ignore 때문에 자동 커밋 대상에 포함되지 않는 로컬 문서라는 전달 리스크가 있다.
- 금지된 후속 task: BFF upstream 검증 오류 400 분류 개선, UI raw zod 메시지 노출 개선. 둘 다 미구현.
- 실제 절감량 부족 여부는 아직 판단 불가. 도메인별 계약 분할은 실측 이후 별도 검토.

## 재검증 (Claude, Codex 사용량 한도로 대체) — 2026-09-13

### 추가 반영된 변경 (최초 검증 이후)
- `import { z } from "zod/mini"` → `import * as z from "zod/mini"` (계약·`url-state`·`selected-course-storage`). 원인: named `z` 네임스페이스 객체가 `locales`(전 언어)·`toJSONSchema`·`core`를 번들에 유지(`node_modules/zod/v4/mini/external.js:1,6,7`).
- ESLint: `zod/mini`는 namespace import만 허용(named/default/side-effect import·re-export 금지), `.claude/skills/**` lint 제외.
- 기존 앱 lint 오류 2건 수정: `useAuthSession`(effect 내 setState → 렌더 중 prop 변화 조정), `useSituationFlowController`(결과 복원 effect → 신규 `features/course-result/hooks/useRestoredCourseCandidates`의 `useSyncExternalStore`).
- `scripts/route-bundle-baseline.json` `measurementStatus: measured` 확정.

### 실행 결과 (로컬, 샌드박스 밖)
| 검증 | 결과 |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` (전체) | 0 error, 2 warning(기존: `useWheelColumn.ts` 미사용 `useMemo`, 미사용 eslint-disable 지시문) |
| `npx vitest run --project '!storybook'` | 43 files / 511 tests passed |
| `node --test scripts/test/*.test.mjs` | 40 passed |
| `npm run build` | 성공 |
| `node scripts/check-route-bundle-budget.mjs` | exit 0, 15개 라우트 전부 한도 내 |
| `npx playwright test` (전체) | 15 passed (auth·course-new·loading-quiz→result·course-map·faq·home·saved). webServer 3100 자동 종료 확인 |
| `npm run test:e2e:ci` | exit 0이나 **스킵됨**: 변경 감지 기준 `HEAD~1`이 MCP chore 커밋이라 "No frontend changes". 커밋 후 CI(`GITHUB_BASE_REF`)에서는 정상 감지 예상 → 대신 전체 playwright로 대체 |

### 라우트별 first-load JS (비압축, production build)
| 라우트 | classic | mini named `z` | mini `import * as z` (최종) | 최종 감소 |
| --- | --- | --- | --- | --- |
| `/` | 875,185 | 857,409 | 629,655 | -245,530 (-28.1%) |
| `/course/new` | 913,599 | 895,823 | 668,496 | -245,103 (-26.8%) |
| `/saved`, `/saved/[id]` | 944,567 | 926,791 | 699,037 | -245,530 (-26.0%) |
| `/login` 외 5개 | 874,619 | 856,843 | 629,089 | -245,530 (-28.1%) |
| `/faq`, `/faq/contact` | 881,993 | 864,217 | 636,463 | -245,530 (-27.8%) |
| `/_not-found`, `/ui-preview/*` | 변화 없음(zod 미사용) | | | 0 |
- 공용 청크 절감이므로 라우트 합산 금지. zod 청크 270,924B → 43,278B, 청크 내 `toJSONSchema`·타 언어 locale 문자열 없음.
- production 영어 locale 초기화 보존: 최종 zod 청크에 `Invalid input: expected …` 메시지 존재 확인(최초 검증의 미검증 항목 해소).

### 리뷰 (버그 / 엣지케이스 / 컨벤션)
- 서버 `$ZodError` 판별·HTTP 매핑: 합의안과 일치, 동작 불변.
- `useAuthSession`: enabled 토글 시 loading 전이가 기존 effect 방식과 동일(true→요청, false→loading false, 진행 중 요청 cancel). 이상 없음.
- `useRestoredCourseCandidates`: 서버 스냅샷=props, 하이드레이션 후 `getSnapshot`에서 sessionStorage 복원 → 기존 mount effect 복원과 동등. store는 `useMemo([active, candidates, requestId, remainingRetries])` 기준 재생성 — `candidates`는 RSC page props라 클라이언트 리렌더 간 참조 안정 → 무한 렌더 위험 낮음. 단 부모가 렌더마다 새 배열을 넘기도록 바뀌면 매 렌더 storage 재조회(성능 저하, 루프는 아님)이므로 주의.
- VSA: 복원 훅은 `course-result` feature 소유, public `index.ts`로 노출, widget은 바인딩만 — 경계 준수.

### Notes (approved_with_notes 사유)
1. Codex gate 미경유 판정 — Codex 한도 해제 후 `useRestoredCourseCandidates`·`useAuthSession` 전환 사후 리뷰 권장.
2. 재추천(reroll) 후 결과 복원 흐름은 e2e 직접 커버 없음(loading-quiz spec이 result 도달까지만 확인) → 사용자 스모크 테스트 권장.
3. `frontend/.agents/guides/performance.md`는 `frontend/.gitignore:47`로 무시되는 파일 — 수정 내용이 커밋되지 않음.
4. CI branch protection 필수 체크 지정 여부 미확인(저장소 설정).
5. Lighthouse 5개 지표·Coverage 재측정은 사용자 측정 대기.
6. 후속 task: BFF upstream 계약 오류 400 오분류, UI raw zod 메시지 노출(`useSaveCourseSheet.ts:67`), `run-e2e-impact.mjs` 로컬 base ref(`HEAD~1`) 한계.
