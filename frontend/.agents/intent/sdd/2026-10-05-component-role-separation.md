# 컴포넌트·컨트롤러 역할 분리 SDD

## Meta
- sdd_id: 2026-10-05-component-role-separation
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시) / 독립 검증 세션(검증)
- status: approved(design) — 사용자 "바로 작업" 선택(토론 생략), 동작 변경 없는 구조 리팩터
- issue: Dayro-dev/dayro#133
- linked_prd: `intent/prd/2026-10-05-component-role-separation.md`

## 역할 기준
- `ui/*.tsx`·widget 화면: 마크업·조합·핸들러 바인딩만. `useState`/`useEffect`/브라우저 API/정책 함수 금지.
- `hooks/*`: 상태·이펙트·브라우저 API·라우팅.
- `model/*`·`lib/*`: 순수 규칙·실행부(React 무관).
- shared 승격은 2곳 이상 실제 재사용 근거가 있을 때만(shared/README).

## Design Decisions

### 1. 모달 다이얼로그 공용화 (shared/ui/lib, 재사용 3곳)
- `useIsClient()`: `useSyncExternalStore` 기반 hydration-safe 클라이언트 감지. SideMenu·ConfirmDialog·useSaveCourseSheetDialog 의 `noopSubscribe` 중복 제거.
- `trapTabFocus(event, container, { lockWhenEmpty })`(순수): Tab/Shift+Tab 순환. 포커스 대상이 없을 때 `lockWhenEmpty`면 container 에 포커스를 묶는다(ConfirmDialog pending 동작 유지).
- `useModalDialog({ open, onEscape, initialFocusRef, restoreFocus, deferInitialFocus, lockWhenEmpty })` → `dialogRef`.
  - 열릴 때: 직전 포커스 저장(restoreFocus) → 초기 포커스(즉시 또는 rAF) → document keydown(ESC·Tab).
  - 닫힐 때/언마운트: 리스너 해제, rAF 취소, 저장한 요소로 포커스 복원.
  - `onEscape`는 `useEffectEvent`로 최신 값을 읽는다 → pending/saving 변화로 effect 가 재실행되지 않는다.
  - 부수 효과(개선): 기존 SaveCourseSheet 는 saving 토글마다 effect 가 재실행되며 복원 대상이 다이얼로그 내부 요소로 덮어써지고 이름 입력으로 포커스가 튀었다 → 해소.
- 컴포넌트별 옵션(기존 동작 유지):
  - SideMenu: 닫기 버튼 즉시 포커스, restoreFocus=false(기존과 동일), lockWhenEmpty=false
  - ConfirmDialog: 확인 버튼 즉시 포커스, restoreFocus=true, lockWhenEmpty=true, ESC 는 pending 이면 무시
  - SaveCourseSheet: 이름 입력 rAF 포커스, restoreFocus=true, ESC 는 saving 이면 무시

### 2. Select (shared/ui/select)
- `useSelect({ options, value, onChange, disabled })`: open/highlight/ref/열기·닫기·선택, 바깥 pointerdown 닫기, 열릴 때 listbox 포커스, 트리거·목록 키보드 핸들러, `optionId`.
- `Select.tsx`는 마크업만.

### 3. 상황입력 컨트롤러 분리 (widgets/situation/hooks)
- `useCourseFlowNavigation({ rev, answers })` → `recordStepUrl`, `goStep`(스냅샷 기록 + `?step=&rev=` push).
- `useCourseFlowRedirects({ step, rev, restoreReady, fallbackAnswers, answers, operationId, generationFailed, generationInterrupted, recordStepUrl, replace, show })`(평탄화한 인자): 복원 불가 fallback replace, 생성 실패/중단 시 purpose 로 replace + 안내, `handledRedirectKey` 소유.
- `useRetryExhaustedNotice({ step, remainingRetries, show })`: 결과 화면에서 잔여 0 진입 시 1회 토스트(#126 회귀 방지 로직 그대로).
- `situation-flow-messages.ts`: 안내 문구 상수.
- `useSituationFlowController`: 위 훅을 조합해 kind 별 뷰 상태만 만든다. 반환 계약 변경 없음.
- 위치는 widgets 유지(#129 토론 합의, feature 배럴 mock 기반 기존 테스트 유지).

### 4. 코스 생성 실행부 (features/situation) — 보류(되돌림)
- 시도: `lib/course-generation-runner.ts`로 `liveOperations`·`runOperation` 이동.
- 결과: 순수 이동인데 **모든 라우트 first-load JS +약 12KB**(`/` 631,987→643,458B, `/course/new` 676,014→687,479B) → 번들 예산 초과.
- 원인 추적: 청크 비교 결과 develop 은 `shared/api/endpoints`+zod 코어가 한 모듈로 병합(scope hoisting)돼 있었는데, 분리 후 병합이 깨져 zod 모듈 9개가 개별 모듈로 들어감. barrel·`"use client"` 가설은 빌드 실험으로 배제, 해당 파일만 되돌리면 원복됨을 bisect 로 확인.
- 결정: 실행부는 이미 훅 밖 모듈 함수로 분리돼 있어 파일 이동 이득이 작으므로 되돌린다(baseline 상향 금지 규칙 우선).

### 5. 순서 변경·로그인 경로 공용화 (shared/lib, 재사용 2곳+)
- `shared/lib/useCoursePreviewOrder.ts`: baseline(마운트 시점 고정)·현재 순서 state, `points`·`isEmpty`·`isReordered`·`reorder`·`resetOrder`·`commitOrder`. React 의존은 `useState`만(기존 테스트 mock 호환).
- `shared/lib/login-redirect.ts` `buildLoginRedirectPath(next)` → `/login?next=<encoded>`. course-map·saved 훅, `require-saved-auth`, `app/mypage` 적용. 검증은 기존대로 로그인 쪽 `sanitizeLoginNextPath`.

### 6. 기타
- `features/faq/hooks/useFaqSearch.ts`(query·filtered·trimmed·isEmpty), `FaqSearchableList`는 마크업만.
- `shared/observability/useWebVitalsLogger.ts`, `WebVitalsLogger`는 훅 호출 + null.
- 미사용: `widgets/situation/SituationTransportScreen.tsx`(+css·배럴 export 확인), `features/course-map/hooks/useSelectedCourse.ts` — 사용자 승인 후 삭제.

### 7. 후속(같은 PR, 사용자 지시)
- 키보드·포커스 회귀 테스트: Storybook play(브라우저) — ConfirmDialog(초기 포커스·Tab 순환·Esc·포커스 복원, pending 중 Esc 무시), SideMenu(닫기 버튼 포커스·Esc), Select(↓·End·Enter·Esc, aria-activedescendant, 트리거 포커스 복귀), SaveCourseSheet(저장 중 포커스 유지·Esc 무시). SaveCourseSheet 스토리는 이전 구현에서 실패함을 확인.
- 고아 `features/situation/ui/transportMeta.ts` 삭제.
- 경계 위반 해소: `shared/api/server-auth-session|server-course|server-auth-cookies.ts`가 `features/auth/model`을 import → 인증 쿠키 이름·수명은 `shared/api/auth-cookies.ts`, 세션 타입은 `shared/api/auth-session.ts`로 옮기고 `features/auth/model/oauth.ts`·`session.ts`는 재노출(기존 import 경로 유지).

## Risks
- 포커스 타이밍 변경으로 a11y 회귀 → 기존 동작을 옵션으로 고정, e2e·unit 회귀 확인.
- `useEffectEvent`는 React 19.2 안정 API(현재 19.2.4).
- 번들: shared/ui/lib 훅 추가로 공용 청크 증가 가능 → 번들 예산 확인(baseline 상향 금지).
