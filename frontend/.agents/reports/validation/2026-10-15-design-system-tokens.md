# Issue #227 디자인 시스템 토큰 최종 검증 리포트

- 실행일: 2026-10-15
- 작업 유형: 최종 코드 리뷰 / validation gate (코드 수정 없음)
- 판정: **changes-requested** (저장소 판정 어휘로는 `rejected`)
- 브랜치: `refactor/#227-design-system-tokens`
- 비교 기준: `origin/develop` = `5abf0fc59a291eb5c66bd2d654e454387e7f3149`; 리뷰 시 HEAD도 동일. 실제 검토 대상은 staged/unstaged 변경과 신규 파일이다.

## Intent Source 및 범위

- `.agents/intent/prd/2026-10-15-design-system-tokens.md`: 의미 토큰 사용, 시각 보존, 재발 방지 목표.
- `.agents/intent/sdd/2026-10-15-design-system-tokens.md`: 행간 미지정, BottomSheet 책임 이전, 의도된 시각 차이 2건.
- `.agents/intent/tasks/2026-10-15-design-system-tokens.md`: 구현 범위와 기존 검증 결과.
- 사용자 제공 방식 A: `git diff origin/develop -- frontend`와 `git status --short`, 신규 파일 직접 열람.
- 제외: `frontend/src/e2e-vr/`, `frontend/vr-tmp.config.mjs`, node_modules 내용 리뷰. 설치된 도구는 검증 실행에만 사용.
- 변경 범위: globals.css, feature/widget 토큰 치환, BottomSheet/EmptyState/NavTitle 공용화, 배럴, 토큰 가드/카탈로그와 테스트, Foundations 및 신규 stories, 의도/사용 문서.

## 발견 사항

### F1 — P2 / 중간: BottomSheet 기본 초기 포커스 계약이 구현되지 않음

- 위치: `frontend/src/shared/ui/sheet/BottomSheet.tsx:41` (공개 계약: 같은 파일 16줄).
- 근거: `initialFocusRef`가 없으면 첫 포커스 가능 요소로 이동한다고 명시하지만, 그대로 `useSheetDialog`에 전달한다. 실제 `frontend/src/shared/ui/lib/useModalDialog.ts:51`은 `initialFocusRef?.current?.focus()`만 수행한다. 기본 대상 탐색이 없다.
- 실제 사용: `frontend/src/features/saved/ui/ShareOptionsSheet.tsx:33`은 ref를 전달하지 않는다. 새 `BottomSheet` Toggle story도 동일하다. 열기 버튼에 포커스가 남고, `focus-trap.ts`는 이미 내부 첫/마지막 요소에 있을 때만 Tab을 순환시키므로 외부 포커스를 즉시 내부로 회수하지 않는다. 배경에 후속 포커스 대상이 있으면 키보드 이동이 배경에 남을 수 있다.
- 영향: 모달을 열었다는 맥락과 이름이 포커스 이동으로 전달되지 않으며, 새 공용 API의 접근성 계약을 만족하지 않는다.
- 구분: 공유 시트의 기존 훅에서도 존재하던 한계다. 이번 리팩터링이 새로 만든 화면 회귀라고 주장하지 않는다. 다만 새 공용 컴포넌트가 기본 동작으로 명시하고 재사용하도록 노출한 계약의 미충족이므로 최종 게이트 보완 대상으로 판단한다.
- 제안: 포털이 실제 마운트된 뒤 명시 ref → 내부 첫 활성 포커스 대상 → `tabIndex=-1` 컨테이너 순으로 초기 포커스를 지정하고, 빈 시트도 처리한다. Toggle story에서 Enter로 열기, 내부 초기 포커스, Tab/Shift+Tab 순환, ESC 닫기와 트리거 복귀를 검증한다.
- 증거 수준: 소스 경로 추적. 브라우저 재현은 아래 환경 제한으로 미실행.

### F2 — P2 / 중간: 토큰 가드가 주요 우회 문법을 통과시킴

- 위치: `frontend/src/shared/ui/tokens/design-token-guard.ts:60` (추가 관련 위치: 26, 32, 51, 57, 101줄).
- 근거: z-index 검사는 CSS에만 적용된다. TSX의 숫자 z 유틸과 React style 객체는 검사하지 않는다. radius 규칙은 단일 값/전체 모서리만, hex 규칙은 콜론 직후 등 일부 위치만 검사한다.
- 실제 함수 호출 재현: 아래 각 입력에 대해 `findTokenViolations`가 모두 `[]`를 반환했다.
  - TSX: `<div className="z-50 z-[40] rounded-t-[24px]" />`
  - TSX: `<div style={{fontSize: 13, borderRadius: 12, zIndex: 40}} />`
  - CSS: `border: 1px solid #fff;`
  - CSS: `color: white;`
  - CSS: `border-radius: 24px 24px 0 0;`
- 영향: 이번에 치환한 z 유틸과 시트 radius 등을 원래 리터럴로 되돌려도 재발 방지 게이트가 녹색이다. “src 전체 위반 0”은 현재 정규식에 잡힌 항목이 없다는 뜻이며, 토큰 우회 부재를 보장하지 않는다.
- 제안: 최소한 실제 치환 문법의 역변환을 잡는 회귀 케이스를 추가한다. 클래스의 z/방향별 radius, CSS 선언의 여러 값과 shorthand, style 객체 숫자를 처리한다. AST/선언 파싱 또는 명시적인 지원 문법을 사용하고, 예외는 파일 전체보다 규칙·값 범위로 좁힌다. 현재 KakaoLoginButton/useKakaoMap 전체 제외는 색 외 글자 크기·radius 재도입까지 허용한다.

### F3 — P3 / 낮음: 가드가 주석과 색상이 아닌 문자열을 오탐함

- 위치: `frontend/src/shared/ui/tokens/design-token-guard.ts:105` (hex 패턴: 32줄).
- 근거: 소스의 모든 줄에 정규식을 바로 적용한다. 실제 함수 호출에서 `// replace text-[13px] with text-label`은 `arbitrary-font-size`, `<a href="#abc">link</a>`는 `raw-hex-color` 위반으로 보고됐다.
- 영향: 정상 주석이나 앵커가 CI를 실패시켜 불필요한 예외 등록을 유도한다. 현재 소스에서 실패한 사례가 아니라 재현 입력으로 확인한 가드 결함이다.
- 제안: 주석을 제외하고 스타일 관련 속성·클래스·CSS 값에 검사 범위를 한정한다. 위 두 정상 입력을 음성 테스트로 추가한다.

### F4 — P3 / 낮음: 새 문서의 배럴 import 규칙과 사용처가 불일치

- 위치: `frontend/src/shared/ui/README.md:6`; 사용처 `frontend/src/features/course-map/ui/SaveCourseSheet.tsx:6`, `frontend/src/features/saved/ui/ShareOptionsSheet.tsx:3`.
- 근거: 문서는 외부 사용자가 `@/shared/ui` 배럴을 쓰도록 명시하지만 신규 BottomSheet 사용은 `@/shared/ui/sheet`다. sheet/index.ts가 존재하므로 내부 파일 직접 참조나 VSA 역의존은 아니다.
- 제안: 하위 폴더 배럴도 공개 API로 허용한다는 규칙을 문서화하거나 사용처를 루트 배럴로 통일한다. 이 항목 자체는 차단 사유가 아니다.

## 관점별 확인 결과

| 관점 | 결과 / 근거 |
| --- | --- |
| 저장 중 ESC / 백드롭 닫기 금지 | 정적 검토상 유지. 두 경로 모두 handleClose를 사용하며 saving이면 반환한다. useModalDialog의 useEffectEvent가 최신 콜백을 읽으므로 saving 변경이 초기 포커스 effect를 재실행하지 않는다. |
| 저장 시트 초기 포커스 / 검증 실패 | 명시 nameInputRef와 deferInitialFocus 유지. validation_error 결과에서 이름 입력에 focus한다. 기존 SaveCourseSheet stories도 초기 포커스와 저장 중 ESC 금지/포커스 유지 assertion을 포함한다. 이번 리뷰에서 해당 브라우저 테스트 재실행은 못 했다. |
| 모달 이름/설명 | BottomSheet useId + h2/aria-labelledby 유지, 저장 상태 describedBy와 입력 label/오류 연결 유지. |
| EmptyState / NavTitle | 기존 의미 태그와 action 슬롯 유지. SharedCourseRedirectScreen은 h1, SavedEmpty는 p. NavTitle은 span이다. |
| Tailwind v4 text-* | 현재 globals.css를 설치된 @tailwindcss/postcss로 재생성. text-label/body/title/caption은 font-size만 생성되고 line-height 선언은 없다. 기존 leading-* 또는 상속 행간을 유지하는 의도와 일치. |
| CSS 변수 | 변경 diff에 추가된 color/text/radius/shadow/duration/ease/z 변수 참조와 기존 Next 빌드 CSS 정의를 비교한 결과 미정의 0. 소스 정의도 확인. 신규 공용 컴포넌트 참조 역시 정의됨. 기존 빌드 산출물 비교만으로 전체 앱 런타임을 재검증했다고 보지는 않는다. |
| 토큰 카탈로그 | 정의 이름과 목록의 양방향 동기화 및 중복 검사 통과. 이 검사는 이름 집합 검사이며 계산값/브라우저 출력 검사와는 별개다. |
| VSA / 서버 경계 | shared의 feature/widget import 검색 결과 없음. 신규 공용 UI는 상대 경로의 공용 UI/훅을 사용하며 서버 전용 모듈을 새로 배럴에 노출하지 않음. 저장 정책은 feature 훅에 남아 있음. |
| 공용화 근거 | BottomSheet 두 시트, EmptyState 두 화면, NavTitle 여섯 화면으로 재사용 근거 충분. |
| 시각 보존 | 사용자 제공 89 story 동일, 앱 22/24 동일을 전달 증거로 기록. FAQ 14.5→15px와 saved 내비 행간 변경은 의도 문서와 일치. 스크린샷을 독립 재생성/비교하지 않았음. |

## 검증 실행 및 Evidence Gate

직접 실행/확인:

- `git status --short`, `git diff origin/develop -- frontend` (지정 임시 경로 제외), `git ls-files --others --exclude-standard frontend` 및 변경/신규 파일 열람.
- `npx vitest run src/shared/ui/tokens/`: **2 files / 8 tests passed**.
- Node + TypeScript transpileModule로 가드 모듈을 메모리에서 로드하여 F2/F3 입력 재현. 저장소에 테스트/코드 파일을 추가하지 않음.
- PostCSS + @tailwindcss/postcss로 현재 globals.css 컴파일: 성공. 출력은 `/tmp/dayro227-generated.css`. 새 글자 크기 유틸의 행간 미생성 확인.
- 기존 `.next/static/chunks/*.css`의 새 변수 참조 존재 여부 대조: 누락 0.
- Storybook `npx storybook dev -p 6027 --ci --no-open`: **환경 차단**. `SB_CORE-SERVER_0018 (NoFreePortError)`, 샌드박스가 포트 listen을 제한한다는 오류. 브라우저 동작 검증 성공으로 집계하지 않음.

사용자 제공 완료 증거(이번 세션 재실행 아님): unit 873, Storybook vitest 112, tsc, eslint, Next build, 번들 예산, e2e 79 통과. 기존 89 stories 픽셀 동일, 앱 24화면 중 22 동일. 전체 검증 중복 실행 대신 변경 집중 테스트와 구조 검토를 수행했다.

- Intent gate: 통과. 사용자 요청 및 PRD/SDD/task 확보.
- Boundary gate: VSA 역의존 문제 없음. 문서 규칙 불일치 F4 있음.
- Evidence gate: **미통과**. 테스트 성공과 별개로 기본 포커스 계약 및 가드 결함 F1/F2 미해결.
- Failure taxonomy: `implementation_bug` (F1/F2/F3), `doc_mismatch` (F4), `external_blocker` (브라우저 확인용 서버 기동).
- 미검증: 실제 브라우저의 키보드 순환/복귀, 저장 중 백드롭, 스크린리더 안내, 전체 시각 비교 재실행. 기존 전달 결과와 직접 수행 결과를 구분했다.

## 문서 적용 및 실행 루프

- 적용 문서: frontend/AGENTS.MD와 .agents/README.md(검증 범위), agents/validation.md(코드 미수정·근거 기반 판정), reports/README.md(보고 항목), guides/accessibility.md(모달 초기 포커스), guides/client-logic-separation.md(저장 정책/공용 훅 책임), guides/server-client-boundary.md(배럴 안전성), guides/storybook.md(공용 계약과 story), src/shared/README.md 및 src/shared/ui/README.md(VSA/토큰/import 규칙), 위 PRD/SDD/task.
- guide trigger: UI/overlay/공용 UI/story/배럴에 적용. BFF/API/auth 정책·도메인 상태 전이는 변경 범위가 아니므로 별도 도메인/BFF 검증 제외. 번들/전역 렌더 성능 벤치마크는 재실행하지 않고 제공 결과로 기록.
- 문서와 사용자 요청의 차이: 저장소 판정 어휘 대신 사용자가 지정한 approve / changes-requested를 우선 사용하고 대응 판정을 병기. 추가 사용자 확인은 필요하지 않았음.
- loop: 리뷰 1회, 수정 루프 없음. handoff는 사용자 변경 요약과 기존 task evidence를 사용. 별도 구현 handoff 파일은 생성하지 않음.
- evidence bundle: 의도 문서 + 변경 코드 + 집중 테스트 + CSS 생성 확인 + 전달 검증 결과.
- 수정한 저장소 파일: 이 validation report만. 구현·테스트·의도 문서는 수정하지 않음.

## 후속 조치

F1의 기본 포커스 동작과 F2의 핵심 우회 누락을 보완한 뒤 집중 재검증해야 한다. F3의 오탐과 F4의 문서 규칙도 함께 정리하는 것을 권고한다. 포커스 수정 후에는 기존 저장 시트 초기 포커스/저장 중 ESC 금지뿐 아니라 기본 ref 없는 시트 열기·Tab 순환·닫기 복귀를 실제 브라우저에서 확인해야 한다.

## 재검증

- 일시: 2026-10-15, F1~F4 보완 후 집중 리뷰.
- **갱신 판정: changes-requested** (`rejected`). 아래 결과가 최초 리뷰의 항목별 상태를 대체한다. 기존 재현 사례는 수정됐으나 공용 포커스 계약과 가드에 잔여 문제가 있어 승인하지 않는다.
- 범위: useModalDialog/useSheetDialog/focus-trap 및 테스트, BottomSheet와 Toggle story, 토큰 가드/회귀 테스트, WithdrawReasonForm CSS, shared/ui README. 소스 코드 수정 없이 이 섹션만 추가했다.

### 기존 발견 사항 처리 상태

| 항목 | 재검증 결과 |
| --- | --- |
| F1 | 일반 메뉴 시트의 초기 포커스 누락은 해결. focusFirstByDefault는 기본 false이고 시트만 true를 전달한다. 명시 ref가 있는 저장 시트 동작과 최신 ESC 콜백은 유지된다. Toggle play에 Enter 열기, 첫 항목 포커스, 양방향 Tab 순환, ESC 닫기/트리거 복귀 assertion이 추가됐다. 다만 아래 R1의 빈/비활성 콘텐츠 경계값은 미해결. |
| F2 | 최초 보고서의 z-50/z-[40], 방향별 radius, 인라인 숫자, CSS shorthand hex/white/복합 radius 입력은 회귀 테스트로 검출됨. 예외는 규칙 단위로 좁혀졌고 WithdrawReasonForm의 white도 토큰으로 교체됨. 다만 R2의 숫자 z 범위 누락이 남음. |
| F3 | 최초 보고서의 주석 예시와 정확히 `href="#abc"`인 입력은 정상 통과. 다만 R3의 문자열 처리/공백 있는 href 문제는 남음. |
| F4 | **해결**. README에 루트 배럴 또는 index.ts 폴더 배럴을 공개 API로 명시하여 실제 사용처와 일치. |

### 잔여 발견 사항

#### R1 — P2 / 중간: 빈 시트 및 비활성 첫 요소에서 포커스 계약 불완전

- 위치: `frontend/src/shared/ui/lib/useSheetDialog.ts:47`, `frontend/src/shared/ui/lib/focus-trap.ts:29`, `frontend/src/shared/ui/lib/focus-trap.ts:54`.
- 근거: 시트가 focusFirstByDefault를 켜지만 `lockWhenEmpty`는 전달하지 않아 기본 false다. 내용이 텍스트뿐이면 초기 포커스는 tabIndex=-1인 시트에 가지만, 다음 Tab/Shift+Tab은 preventDefault 없이 반환해 배경으로 이동한다. 실제 trapTabFocus 함수에 빈 컨테이너와 기본 옵션을 전달한 재현에서 `Tab prevented: false`를 확인했다. 기존 테스트도 lockWhenEmpty가 true일 때만 잠긴다는 사실을 검증하고 있다.
- 추가 경계값: firstFocusable은 기존 `button, [href], input, ...` 선택자를 그대로 사용하여 disabled 버튼과 hidden 입력도 선택한다. 첫 자식이 `<button disabled>`이고 뒤에 활성 버튼이 있을 때 비활성 버튼의 focus()는 포커스를 옮기지 못하고, 컨테이너 fallback도 실행되지 않는다. 이 부분은 DOM 선택자/브라우저 focus 의미에 근거한 정적 확인이며 이번 세션 브라우저 실행으로 재현한 것은 아니다.
- 영향: 일반 메뉴 story는 성공해도 새 API가 명시한 “첫 포커스 가능 요소, 없으면 시트 자체”와 모달 내부 순환이 콘텐츠에 따라 깨진다. 기존 실제 두 시트의 정상 상태 회귀를 주장하는 것은 아니다.
- 제안: 시트에서 빈 상태 잠금을 활성화하고, 초기 대상 탐색과 Tab 순환에 동일한 실제 활성·표시 가능한 대상 목록을 사용한다. 텍스트 전용 시트, 첫 항목 disabled/hidden, 모든 항목 disabled의 브라우저 회귀 테스트를 추가한다.

#### R2 — P2 / 중간: 30 이상 z 유틸 규칙이 30~90의 10 단위 값만 검사

- 위치: `frontend/src/shared/ui/tokens/design-token-guard.ts:85`.
- 근거: `[3-9]0`은 30, 40, …, 90만 매칭한다. 실제 `findTokenViolations('a.tsx', '<div className="z-31 z-100 z-999" />')` 호출은 `[]`를 반환했다. Tailwind v4에서 사용할 수 있는 숫자 z 유틸이며 README의 “화면 레이어(30 이상)는 토큰” 규칙과 맞지 않는다.
- 영향: 높은 레이어를 만드는 대표적인 z-100을 추가해도 재발 방지 검사가 통과한다.
- 제안: 숫자 값을 추출해 범위를 검사하거나 모든 정수 문법을 매칭한 뒤 허용 정책을 적용한다. 경계값 29/30/31/90/100 및 허용값 0/10/20을 테스트한다.

#### R3 — P3 / 낮음: 주석 제거가 문자열을 이해하지 못하고 href 예외가 공백에 취약

- 위치: `frontend/src/shared/ui/tokens/design-token-guard.ts:139` (stripComments), 같은 파일 39줄(script hex 패턴).
- 실제 재현 1: `const label = "a // b"; const node = <div className="text-[13px]" />;`가 위반 없이 통과한다. stripComments가 문자열 내부의 `//`부터 줄 끝까지 지워 뒤의 실제 스타일 위반도 제거한다. `//` 직전 한 글자 검사로는 문자열 내부 여부를 판단할 수 없다.
- 실제 재현 2: `<a href = "#abc">link</a>`가 raw-hex-color로 오탐된다. `(?<!href=)`는 공백 없는 표기만 제외한다.
- 제안: 문자열/템플릿과 주석을 구분하는 lexer 또는 TypeScript AST 기반으로 검사 범위를 추출하고, JSX href 속성을 문법적으로 제외한다. 두 입력을 추가 회귀 테스트에 포함한다. 최초 재현 입력만 해결됐다고 F3 전체를 완료 처리하기는 어렵다.

### 실행 증거와 한계

- 직접 실행: `npx vitest run src/shared/ui/tokens/ src/shared/ui/lib/focus-trap.test.ts` → **3 files / 19 tests passed** (토큰 관련 12, focus-trap 7).
- 직접 실행: 현재 TypeScript 모듈을 메모리에서 transpile/load하여 R2/R3 입력과 빈 컨테이너 Tab 처리를 호출. 결과는 각 항목에 기록했다. 저장소에 재현 코드/테스트 파일은 생성하지 않았다.
- 직접 검토: git status, 관련 origin/develop diff, 신규 파일 및 변경된 Toggle story의 assertion. 저장 중 닫기 방지 콜백과 명시 초기 ref 경로가 유지됨을 확인했다.
- 사용자 제공 재실행 결과: unit 879, Storybook 112, tsc, eslint, build, 번들 예산, e2e 79 통과. 기존 89 stories 픽셀 동일, 앱 22/24 동일(기존 의도 차이 2건). 이는 사용자 제공 evidence로 수용하며 이번 세션 직접 실행 결과와 구분한다.
- 브라우저 테스트/시각 비교는 이번 집중 검증에서 재실행하지 않았다. 이전 세션의 포트 제한이 있었고, 이번에는 제공된 브라우저 결과와 새 story 코드를 확인했다. 잔여 경계값은 제공된 Toggle story가 다루지 않는다.
- `frontend/test-results/.last-run.json` 변경은 재검증 시작 시부터 존재한 사용자 작업 산출물로, 수정하거나 되돌리지 않았다.
- Evidence gate: 기존 회귀 입력 및 집중 테스트는 통과하나 R1/R2 미해결로 최종 게이트 미통과. Failure taxonomy는 `implementation_bug`; R3는 추가 오탐·누락 보완 사항이다.
- 다음 검증 범위: R1 빈/비활성 시트 키보드 동작, R2 z 정수 경계값, R3 문자열·href 문법 회귀 사례. F4는 재수정 불필요.

## 재검증 2

- 실행일: 2026-10-15. 마지막 라운드, R1~R3 수정에 대한 집중 검증.
- **최종 판정: approve** (저장소 어휘: `approved_with_notes`). 이 판정이 앞선 changes-requested 판정을 대체한다.
- 승인 범위: issue #227의 현재 사용처, 명시된 포커스 경계값 및 토큰 가드 회귀 사례. 가드는 재발 방지용 휴리스틱으로 평가하며 모든 TSX/CSS 문법의 완전한 분석을 승인 조건으로 요구하지 않는다. AST 도입은 필수 수정 사항이 아니다.
- 작업 결과: 코드 수정 없이 이 보고서 끝에 본 섹션만 추가했다.

### 항목별 종결

| 항목 | 확인 근거 | 판정 |
| --- | --- | --- |
| R1 빈 시트 | useSheetDialog가 `lockWhenEmpty: true`를 전달한다. focusFirstByDefault와 BottomSheet의 tabIndex=-1을 통해 시트 자체를 초기 대상으로 삼고, 빈 목록에서는 Tab/Shift+Tab을 막고 컨테이너에 포커스를 유지한다. TextOnly story에 초기 포커스 및 양방향 Tab 유지 assertion이 있다. | 기존 재현 사례 해결 |
| R1 비활성 첫 항목 | 초기 대상 탐색과 순환이 동일한 FOCUSABLE_SELECTOR를 사용한다. 기본 button/input/select/textarea 분기에서 disabled를, input 분기에서 type=hidden을 제외한다. DisabledFirstItem story가 비활성 버튼 다음 ‘확인’의 초기 포커스를 검증한다. | 기존 재현 사례 해결 |
| R2 z 정수 범위 | `[3-9][0-9]` 및 `[1-9][0-9]{2,}`로 30 이상의 정수를 검사한다. 30/31/90/100/999/[5] 검출, 0/10/20/29/변수 유틸 허용을 테스트한다. | 해결 |
| R3 문자열/주석/href | 코드·따옴표 문자열·템플릿·줄/블록 주석 상태를 구분한다. 문자열 내부 `//` 뒤의 실제 위반 검출, 공백 있는 href 정상 통과, JSX It's 다음 줄의 위반 줄 번호를 회귀 테스트로 확인했다. | 기존 재현 사례 해결 |
| F4 공개 API 문서 | 루트 및 폴더 index.ts 배럴 허용 규칙 유지. | 해결 유지 |

저장 시트의 명시 initialFocusRef와 deferInitialFocus 경로, saving 상태의 닫기 방지, useEffectEvent를 통한 최신 ESC 콜백 처리는 유지된다. 이번 변경에서 새 VSA 역의존이나 서버 전용 배럴 노출을 발견하지 않았다. 이전 검증의 토큰 정의/생성 CSS 및 의도된 시각 차이 2건에 대한 판단도 유지한다.

### 실행 증거

- 직접 실행: `npx vitest run src/shared/ui/tokens/ src/shared/ui/lib/focus-trap.test.ts` → **3 files / 21 tests passed** (토큰 관련 14, focus-trap 7).
- 직접 확인: git status, focus-trap/useSheetDialog의 origin/develop diff, useModalDialog/저장 시트 정책 훅, 토큰 가드와 전체 회귀 테스트, BottomSheet stories, shared/ui README.
- 사용자 제공 최신 실행 결과: **unit 881, Storybook 114, tsc, eslint, build, 번들 예산, e2e 79 통과**. 앱 24화면 중 22 동일, 의도된 2건 차이 유지.
- 신규 DisabledFirstItem/TextOnly의 브라우저 성공은 사용자 제공 Storybook 결과로 수용했다. 이번 세션에서 브라우저·전체 빌드·시각 비교를 독립 재실행하지 않았으며, 직접 실행한 21개 테스트와 구분한다. 기존 스토리 89개 픽셀 동일은 앞선 라운드의 전달 증거이며 이번 라운드의 재실행 결과로 재표기하지 않는다.

### 비차단 참고사항 및 검증 한계

1. **P3 / 문서 불일치** — `frontend/src/shared/ui/README.md:27`: 현재 파일의 토큰 우회 검사 절에는 사용자 설명의 “휴리스틱이며 리뷰를 대체하지 않는다” 문구가 아직 없다. 파일 열람 및 문구 검색으로 확인했다. 사용자 메시지의 명시적 범위 결정은 이번 판정에 적용하고, README 문구 반영은 후속 문서 정리로 남긴다. 코드 검증을 다시 차단하지 않는다.
2. **P3 / 공용 포커스 선택자 추가 한계** — `frontend/src/shared/ui/lib/focus-trap.ts:3`: 마지막 `[tabindex]:not([tabindex="-1"])` 분기는 disabled/hidden 필터가 없어 `<button disabled tabIndex={0}>` 같은 조합을 다시 포함할 수 있다. CSS로 숨긴 요소까지 판별하는 선택자도 아니다. 이번 기존 재현 사례와 두 실제 시트에서 확인된 회귀는 아니므로 비차단 후속 보강 대상으로 남긴다. 향후 해당 콘텐츠를 지원할 때 전체 후보에 활성·표시 여부를 공통 필터링하고 브라우저 케이스를 추가하는 것이 적절하다.
3. 가드의 lexer/정규식은 완전한 TSX/CSS 파서가 아니다. 보고된 재현 사례와 현재 검사 대상의 테스트 통과를 근거로 승인하며, 모든 표현식·동적 클래스·스타일 값의 오탐/누락 부재를 보장하지 않는다.

### 최종 게이트

- Intent: 기존 PRD/SDD/task 및 이번 사용자 범위 결정에 부합.
- Boundary: 현재 변경 범위에서 차단할 VSA/서버 경계 문제 없음.
- Evidence: 집중 테스트 직접 통과 + 사용자 제공 전체 검증 + 회귀 story assertion 확인으로 통과.
- 잔여 차단 사항: **없음**. 기존 F1~F4 및 R1~R3의 구체적인 재현 사례는 종결한다.
- 남은 사항: 위 P3 문서/선택자 한계는 비차단 후속 항목으로 보존한다. 추가 수정 라운드를 승인 조건으로 요구하지 않는다.

## 비차단 참고사항 반영 (Claude, 재검증 2 이후)

- 참고 1: `src/shared/ui/README.md` 토큰 우회 검사 절에 "휴리스틱 · 리뷰 대체 아님" 문구 추가
- 참고 2: `FOCUSABLE_SELECTOR` 의 `[tabindex]` 분기에도 `:not([disabled])` 추가
- 재실행: unit 881 · storybook 114 · tsc 통과
