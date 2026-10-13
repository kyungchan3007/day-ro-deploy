# Validation Report - 컴포넌트·컨트롤러 역할 분리 (issue #133)

## Meta
- task_id: 2026-10-05-component-role-separation
- date: 2026-10-05
- validator: 독립 ValidationAgent 세션(구현에 참여하지 않음, 소스 비변경)
- branch: `refactor/#133-component-role-separation` (HEAD = origin/develop `9dd187a` 대비 미커밋 변경)
- decision: **`approved_with_notes`** — P1/P2 없음. 단 `npm run build` + `node scripts/check-route-bundle-budget.mjs`는 이 세션 허용 명령 밖이라 미실행 → 머지 전 구현자가 실행해 AC "번들 예산 baseline 상향 금지"를 확인할 것(조건부).

## 작업 요약
TSX 컴포넌트의 state/effect/브라우저 API 를 커스텀 훅으로 이동, 모달 포커스 트랩 3중 구현을 `shared/ui/lib`로 단일화, `useSituationFlowController`를 navigation·redirects·retry notice·messages 로 분리, 코스 순서/로그인 리다이렉트 공용화. 원칙: 동작 변경 없음(SaveCourseSheet saving 토글 시 포커스 재이동 버그 해소는 문서화된 의도적 개선).

## Intent / AC 출처
- `.agents/intent/prd|sdd|tasks/2026-10-05-component-role-separation.md`
- 기준: `src/shared/README.md`, `src/widgets/README.md`, `.agents/agents/feature.md`

## 변경 파일 요약
| 영역 | 파일 |
|---|---|
| 모달 공용화 | 신규 `shared/ui/lib/{useIsClient,focus-trap,useModalDialog}.ts`, `lib/index.ts` export / 적용 `shared/ui/layout/SideMenu.tsx`, `shared/ui/dialog/ConfirmDialog.tsx`, `features/course-map/hooks/useSaveCourseSheetDialog.ts` |
| Select | 신규 `shared/ui/select/{useSelect,types}.ts`, `Select.tsx` 슬림화 |
| 상황 흐름 | 신규 `widgets/situation/hooks/{useCourseFlowNavigation,useCourseFlowRedirects,useRetryExhaustedNotice,situation-flow-messages}.ts`, `useSituationFlowController.ts` 슬림화 |
| 코스 순서/로그인 | 신규 `shared/lib/{useCoursePreviewOrder,login-redirect}.ts` / 적용 `features/course-map/hooks/useCourseMapScreen.ts`, `features/saved/hooks/useSavedCourseDetailScreen.ts`, `features/saved/server/require-saved-auth.ts`, `app/mypage/page.tsx` |
| FAQ / Web Vitals | 신규 `features/faq/hooks/useFaqSearch.ts`, `shared/observability/useWebVitalsLogger.ts` |
| 테스트 | 신규 `shared/ui/lib/focus-trap.test.ts`, `shared/lib/course-order.test.ts` |
| T7 삭제(staged, 사용자 승인) | `widgets/situation/SituationTransportScreen.tsx`(+css), `features/situation/ui/TransportCardGroup.tsx`(+css), `features/situation/hooks/useTransportStep.ts`, `features/course-map/hooks/useSelectedCourse.ts` + 배럴 정리 |

> 참고: T7 삭제분은 검증 시작 시점 스냅샷에는 없었고 검증 도중 working tree 에 나타났다(staged). tasks T7 에 사용자 승인으로 기록돼 있어 범위 내로 보고 함께 검증했다.

## 요구사항 충족 여부
| AC | 결과 | 근거 |
|---|---|---|
| must: 대상 tsx 에 useState/useEffect/document·window 미잔류 | 충족 | 변경 tsx(SideMenu, ConfirmDialog, Select, FaqSearchableList, WebVitalsLogger, SaveCourseSheet) grep 결과 hook 0건. 남은 `document.body`는 `mounted` 가드된 portal target(`SideMenu.tsx:116`, `ConfirmDialog.tsx:126`, `SaveCourseSheet.tsx:128`) — 렌더 시점 portal 대상 지정이라 허용 범위로 판단 |
| must: 포커스 트랩·마운트 감지 단일화 | 충족 | `noopSubscribe`/`querySelectorAll(focusable)` 중복 제거, `useIsClient.ts`, `focus-trap.ts`, `useModalDialog.ts` 한 곳 |
| must: 키보드·포커스·라우팅 동일 | 충족(아래 상세 비교) | 의도적 개선 1건(SaveSheet) 외 차이는 도달 불가하거나 무해(P3) |
| must: `useSituationFlowController` 반환 계약 불변 | 충족 | HEAD 대비 return 블록(restoring/loading/result/course/step) 필드·핸들러 동일. 문구 상수는 문자열 바이트 동일(`situation-flow-messages.ts`) |
| must not: 번들 예산 상향 | **미확인** | build/budget 미실행(허용 명령 밖). T4 runner 분리는 되돌려졌고 `features/situation/hooks/useCourseGeneration.ts`는 HEAD 와 동일함을 확인(`git diff HEAD --quiet` exit 0) |
| must not: 디자인·문구 변경 | 충족 | className/JSX 마크업·문구 diff 없음 |

## 상세 동작 비교

### 1. useModalDialog vs 원본 3종
| 항목 | ConfirmDialog | SaveCourseSheet | SideMenu |
|---|---|---|---|
| 초기 포커스 대상/시점 | 확인 버튼, 즉시 — 동일 | 이름 입력, rAF — 동일(`deferInitialFocus: true`) | 닫기 버튼, 즉시 — 동일 |
| ESC | `!pending`일 때만 onClose — 동일(useEffectEvent 로 최신 pending 읽음) | `handleClose`가 saving 중 무시 — 동일 | 항상 setOpen(false) — 동일 |
| Tab 순환 | 동일 선택자·wrap | 동일 | 동일 |
| lockWhenEmpty | true — 동일(dialog `tabIndex={-1}` `ConfirmDialog.tsx:74`) | false — 동일 | false — 동일 |
| 닫힘 시 포커스 복원 | 예 — 동일(cleanup) | 예 — 동일(원본은 별도 effect, 실행 순서 동치) | 아니오 — 동일(`restoreFocus: false`) |
| effect 재실행 | 원본: keydown effect 가 pending 변화마다 재등록(포커스 영향 없음) → 신규: 재등록 없음 | **원본: saving 토글마다 재실행 → 복원 대상 덮어쓰기 + 이름 입력 재포커스 / 신규: 재실행 없음(문서화된 개선)** | 원본 deps `[open, setOpen]`; `AccountMenu`가 `useState` setter(안정) 전달 → 사실상 동일 |

- deps `[open, initialFocusRef, restoreFocus, deferInitialFocus, lockWhenEmpty]`는 모두 ref 객체/상수라 open 변화에서만 재실행. `useEffectEvent`는 effect 안에서 등록한 리스너에서만 호출 — React 19.2 사용 규칙에 부합, lint 통과.

### 2. useSelect
- state/ref/useId/openMenu/closeMenu/choose/두 effect/키보드 핸들러가 원본과 문자 단위로 동일. `toggleMenu`는 원본 인라인 onClick 과 동일 식. ARIA(`aria-haspopup`, `aria-expanded`, `role=listbox`, `aria-activedescendant`, `role=option`, `aria-selected`) 마크업 변경 없음. `SelectOption` 타입은 `types.ts`로 이동 후 `Select.tsx`·`index.ts`에서 재export 유지.

### 3. 상황 흐름 분리
- effect 실행 순서: useCourseGeneration → (restoreReady 초기화) → fallback → operation → retry notice. 원본과 동일 순서(훅 호출 순서 보존).
- deps: `router` → `replace`로 바뀐 것 외 동일. `handledRedirectKey`는 `useCourseFlowRedirects` 내부 단일 ref 로 fallback/operation 키 공유 — 원본 의미(키 prefix `fallback:`/`operation:`, restoreReady 시 fallback 키만 초기화) 동일.
- #126 가드: `useRetryExhaustedNotice.ts:26-36` — result step 이 아니면 비교값 갱신 없이 return. 원본과 동일.
- `replace: router.replace` 비바인딩 전달 안전성: Next 16.2.9 `useRouter()`는 `AppRouterContext` 값을 반환하고(`next/dist/client/components/navigation.js:146-156`), 그 값은 모듈 싱글턴 `publicAppRouterInstance`(`app-router.js:434`)이며 `replace`/`push`는 화살표 함수 프로퍼티(`app-router-instance.js:288,331,343`)라 `this` 의존 없음 + 참조 안정. 테스트에서 매 렌더 새 mock 객체를 반환하더라도 `handledRedirectKey`가 중복 실행을 막는 구조는 원본(`router` deps)과 동일.

### 4. 코스 순서 / 로그인 리다이렉트
- saved: `commitOrder()` = `setBaseline([...places])`, 같은 렌더 클로저의 `places` 사용 → 원본 `setSavedPlaces([...places])`와 동치. 401 경로 `buildLoginRedirectPath(pathname)` 동일 문자열.
- course-map: baseline = 마운트 시점 `initialPlaces` 스냅샷(원본은 매 렌더 prop 비교/리셋) — 아래 P3-1.
- `login-redirect.ts`: 지시어·브라우저 API 없음, 순수 함수 → 서버 파일(`require-saved-auth.ts`, `app/mypage/page.tsx`)에서 안전. `/login?next=%2Fmypage` 출력 동일(테스트 확인).

### 5. FAQ / Web Vitals
- `useFaqSearch`: 원본 로직 그대로, `hasResults` = `filtered.length > 0`. `useWebVitalsLogger`: effect 본문·deps `[route]` 동일. `WebVitalsLogger`는 서버 페이지용 client 경계로 유지.

### 6. VSA / 'use client'
- shared 신규 파일은 features/widgets import 없음. widgets 신규 훅은 `@/features/situation` public 배럴만 import.
- `useCoursePreviewOrder`는 course-map·saved 2개 feature 재사용 → shared 승격 근거 충족.
- 'use client': 훅 파일에 지정, 순수 함수(`focus-trap.ts`, `login-redirect.ts`, `types.ts`)는 미지정 — 적절. `shared/ui/lib` 배럴에 client 모듈 추가는 기존 `useControllableState`와 같은 패턴.

## Evidence (검증자가 직접 실행, `frontend/`)
| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run lint` | exit 0 — 0 errors, 2 warnings(기존: `public/mockServiceWorker.js`, `useWheelColumn.ts` 미사용 import, 이번 변경 무관) |
| `npx vitest run` (unit + storybook 브라우저 프로젝트), 2회 | 694 passed / 2 failed — 2회 모두 `src/features/faq/test/contact-form.test.tsx` 5s timeout(동적 import). 단독 실행 2/2 pass |
| `npx vitest run .test.` (unit 만), 2회 | 54 files / 616 passed, 실패 0 |
| HEAD 스냅샷(`git archive HEAD` → scratchpad, node_modules symlink) `npx vitest run .test.`, 2회 | 52 files / 607 passed (+9 = 신규 테스트 2파일) |
| `npx vitest run src/shared/ui/lib/focus-trap.test.ts src/shared/lib/course-order.test.ts src/widgets/situation src/features/course-map src/features/saved src/features/faq` | 24 files / 95 passed |
| `git diff HEAD --quiet -- src/features/situation/hooks/useCourseGeneration.ts` | exit 0 (변경 없음 확인) |
| 삭제 모듈 잔여 참조 grep(`src`, `.storybook`) | 0건 |
| build / 번들 예산 / e2e | **미실행**(지시상 허용 밖). evidence 로 사용하지 않음 |

- contact-form flake 판단: unit 단독 실행에서는 working tree 도 실패 0이고, 실패는 storybook 브라우저 프로젝트와 병렬일 때만 발생(부하성 timeout). HEAD 스냅샷은 scratchpad 경로에서 storybook 프로젝트 자체가 로드 실패해 동일 조건 비교는 불가. 이번 변경이 ContactForm 의존 그래프에 추가한 것은 `ConfirmDialog` → `useModalDialog`/`focus-trap`/`useIsClient` 3개 소형 모듈뿐이라 원인으로 보기 어렵다 → 기존 flake 로 판단.

## Failure Taxonomy / Findings
P1: 없음 / P2: 없음

### P3 (차단 아님)
1. **course-map baseline 이 마운트 스냅샷으로 고정** — `src/shared/lib/useCoursePreviewOrder.ts:40`, `src/features/course-map/hooks/useCourseMapScreen.ts:54-61`.
   - 원본은 `isReordered`/`resetOrder`가 매 렌더 최신 `initialPlaces` prop 을 기준으로 했다. 신규는 마운트 시점 값만 쓴다.
   - 실패 시나리오: `CourseMapScreen`이 언마운트 없이 다른 내용의 `places`를 받으면 "되돌리기"가 이전 코스로 리셋. 현재는 course 화면 이탈이 항상 kind 변경(restoring/result)을 거쳐 언마운트되므로 **도달 불가**, 참조만 바뀌는 경우는 `isSameCourseOrder`가 placeId 비교라 영향 없음.
   - 제안: 훅 JSDoc 의 "마운트 시점 값만 사용"을 호출부 요구사항으로 명시하거나, `SituationFlow.tsx:93`의 `<CourseMapScreen>`에 rev 기반 `key` 부여 검토.
2. **SaveCourseSheet 가 열린 채 언마운트될 때도 포커스 복원 시도** — `src/shared/ui/lib/useModalDialog.ts:68-74`. 원본 SaveSheet 는 `open` false 전환 시에만 복원했다. 언마운트(예: 401 → `router.push(login)`) 시 분리된 요소 `focus()`는 no-op 이라 사용자 영향 없음. 또 ConfirmDialog 원본은 `activeElement as HTMLElement`(SVG 포함)였고 신규는 `instanceof HTMLElement` 필터 — SVG 포커스 요소는 복원 안 됨(실사용처 없음). 기록만.
3. **모달/Select 동작 회귀 테스트 부재** — `focus-trap.test.ts`는 순수 함수만, stories(`ConfirmDialog/SideMenu/Select.stories.tsx`)에 키보드·포커스 play 단언 없음. 이번 리팩터의 핵심 위험(ESC while pending, 복원 대상, saving 토글 시 재포커스 없음)이 자동 검증되지 않는다. 제안: storybook play 또는 jsdom 테스트로 (a) pending 중 ESC 무시 (b) 닫힘 후 트리거로 포커스 복원 (c) SaveSheet saving 토글 시 activeElement 유지 추가.
4. **`course-order.test.ts`가 `react` 모듈 전체를 mock** — `src/shared/lib/course-order.test.ts:5-11`. 훅을 일반 함수로 호출해 setter 호출 순서(`[setBaseline, setPlaces]`)에 의존 → useState 선언 순서만 바뀌어도 깨지는 구현 결합 테스트. 순수 로직은 `course-preview.ts` 테스트로 충분하므로 유지 시 주석으로 의도 명시 권장.
5. **문서 드리프트** — SDD `intent/sdd/2026-10-05-component-role-separation.md:38`의 `useCourseFlowRedirects({ restore, generation, ... })` 시그니처가 실제(평탄화된 `restoreReady`/`fallbackAnswers`/`generationFailed`/`generationInterrupted`/`replace`)와 다름. `.agents/domain/course-map.md:95`가 삭제된 `useSelectedCourse.ts`를 참조. 갱신 필요.
6. **T7 범위/커밋 위생** — 삭제분은 staged, 나머지는 unstaged 로 섞여 있다. 고아 `src/features/situation/ui/transportMeta.ts`(참조 0건)는 tasks 에 후속으로 기록됨. 리팩터 커밋과 삭제 커밋을 분리하면 리뷰·revert 가 쉬움.

### 범위 밖 관찰(기존)
- `src/shared/api/server-auth-session.ts:3-4`, `server-course.ts:5`, `server-auth-cookies.ts:10`이 `features/auth/model/*`을 import — `shared`는 feature 를 import 하지 않는다 규칙 위반(이번 PR 무관, 별도 이슈 권장).

## VSA 준수
- 신규 shared 코드의 feature 의존 없음, widgets 는 feature public API 만 사용, 화면 조합(widgets)·조각(features) 경계 유지. 위반 없음(기존 shared/api 건 제외).

## 최종 결정
**`approved_with_notes`** — 동작 동등성(의도된 SaveSheet 개선 제외), 반환 계약, 레이어 경계, 타입/린트/단위 테스트 모두 충족. 머지 전 조건: `npm run build` + `node scripts/check-route-bundle-budget.mjs` 통과 확인(AC must-not). P3-3(모달 회귀 테스트), P3-5(문서 갱신)는 후속 권장.

## 남은 리스크 / 후속
- 번들 예산 미확인(위 조건).
- e2e 미실행 — 상황 흐름 리다이렉트·저장 시트 포커스는 사용자 e2e/수동 확인 대상.
- contact-form 병렬 flake: 기존 이슈로 분리 추적 권장(testTimeout 상향 또는 storybook 프로젝트와 분리 실행).


## Addendum — 후속 반영(구현자, 2026-10-05)
- P3-3 회귀 테스트: Storybook play 7건 추가(ConfirmDialog 2, SideMenu 1, Select 1, SaveCourseSheet 2 + Default). `SavingKeepsFocus`는 develop 구현으로 되돌리면 실패, 현 구현에서 통과.
- 범위 밖 경계 위반 해소: shared/api 가 features/auth/model 을 import 하지 않도록 `shared/api/auth-cookies.ts`·`auth-session.ts`로 이동, auth model 은 재노출.
- 고아 `features/situation/ui/transportMeta.ts` 삭제.
- 재검증: lint 0 errors, tsc, unit 700 pass(기존 flaky 2), build, 번들 예산 통과, e2e 18/18.
