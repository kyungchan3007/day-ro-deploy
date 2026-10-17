# 첫 진입 시작 화면 · 온보딩 최종 리뷰

- 일자: 2026-10-15
- 대상: issue #230 / QA #25 / `feat/#230-onboarding`
- 판정: **changes-requested** (저장소 용어 대응: `rejected`)
- 작업: 코드 수정 없는 최종 검증. 이 리포트만 추가했다.
- 방식 A: `git status --short`, `git diff origin/develop -- frontend`, untracked 신규 파일 직접 읽기. node_modules 소스는 리뷰 대상에서 제외했다.

## 수정 요청

### F1 · P2 · 본문과 활성 건너뛰기 버튼의 텍스트 대비 부족

- 위치: `src/features/onboarding/ui/css/OnboardingCarousel.module.css:44`, 같은 파일 `:98`, `src/features/onboarding/ui/css/StartHero.module.css:55`, `src/app/globals.css:78`.
- 근거: 흰색 AppShell 배경에서 설명은 `#8a8a8a`, 15px 일반 글자이며 대비는 **3.45:1**이다. 활성 버튼인 건너뛰기는 `--color-text-disabled` (`#a8a8a8`), 14px/500이며 **2.38:1**이다. 둘 다 WCAG 2.2 AA 일반 텍스트 기준 4.5:1에 못 미친다. 건너뛰기는 실제 disabled 요소가 아니므로 비활성 컨트롤 예외가 적용되지 않는다. 색상 상수의 sRGB 상대휘도로 계산했으며 브라우저 axe 실행 결과로 표현하지 않는다.
- 영향: 저시력 사용자가 서비스 설명과 온보딩을 종료하는 활성 동작을 읽기 어렵다. 새 화면에서 도입된 문제이며 기존 푸터 대비 문제를 확대해 지적한 것이 아니다.
- 제안: 해당 본문·활성 버튼에 흰 바탕 대비 4.5:1 이상인 의미 토큰을 사용한다. 토큰 색을 바꿀 경우 catalog와 사용처를 함께 확인하고, 시작 화면 및 세 장 모두의 대비를 검증한다.

### F2 · P2 · 세로 스크롤 제스처를 가로 스와이프로 오인

- 위치: `src/features/onboarding/hooks/useOnboarding.ts:49`–`:59`.
- 근거: 시작/종료의 X만 기록하고 Y 및 터치 identifier는 무시한다. 예를 들어 `(300, 500) → (240, 200)`은 주로 위로 움직이는 제스처지만 `deltaX=-60`으로 다음 장이 된다. `.slide`는 `overflow-y:auto` (`ui/css/OnboardingCarousel.module.css:77`)여서 작은 화면/확대 시 세로 스크롤이 필요한 영역이다. 이 영역에서 완료된 touchend가 전달되면 동일한 판정이 적용된다.
- 영향: 내용을 읽으려고 위아래로 움직일 때 의도치 않게 장이 전환될 수 있다. 기존 e2e의 합성 touch는 Y를 300으로 고정하므로 이 조건을 검증하지 않는다(`src/e2e/onboarding/onboarding.spec.ts:84`–`:89`).
- 제안: 시작 X/Y와 동일 손가락을 추적해 수평 이동이 수직 이동보다 우세할 때만 전환하고, 다중 터치 및 touchcancel을 정리한다. 수평 50px 경계와 함께 수직 우세 대각선·취소 조건을 검증한다. 실제 터치 기기 재현은 이번 리뷰에서 실행하지 않았으며 코드의 이벤트 판정에 근거한 finding이다.

## 요구사항 및 엣지케이스 검토

| 항목 | 판단 / 근거 |
| --- | --- |
| 비회원 첫 진입 | cookies를 await한 서버 분기로 StartScreen 선택. 클라이언트 인증 조회 뒤 화면을 교체하는 방식이 아님 |
| 회원 / refresh만 존재 | 두 인증 쿠키 중 비어 있지 않은 값 하나라도 있으면 HomeScreen. 모델 테스트 포함 |
| 만료·위조 토큰 | 쿠키 값이 남아 있으면 홈을 선택하는 것은 승인된 SDD의 명시적 정책. 인증 성공 판정이나 보호 API 권한 부여로 쓰이지 않으므로 자체 보안 결함으로 분류하지 않음 |
| 둘러보기 종료 | 건너뛰기·시작하기 모두 쿠키 기록 후 고정 `/`로 replace. 제공된 e2e는 시작→온보딩→홈과 같은 context 재방문을 검증함 |
| 로그아웃·탈퇴 후 `/` | 기존 auth 쿠키 정리와 router.refresh 경로 확인. guest 쿠키가 없으면 시작 화면, 같은 세션에 둘러보기를 선택했다면 홈으로 가는 것이 현재 규칙과 일치. 이번 브라우저 통합 재검증은 하지 않음 |
| 세션 쿠키 | Path=/, SameSite=Lax, HTTPS에서 Secure, Domain/Expires/Max-Age 없음. 브라우저 JS가 쓰는 비민감 UI 선택이므로 HttpOnly 부재는 적절함 |
| 오픈 리다이렉트 | 새 흐름의 목적지는 상수 `/`, `/onboarding`, 기존 카카오 시작 endpoint. 사용자 입력 목적지를 추가하지 않음 |
| inert / aria | 비현재 section은 inert+aria-hidden, 현재 장 하나만 접근성 트리에 노출. 장식 그림 aria-hidden, 진행 상태 aria-live, 실제 button/link 사용 |
| 키보드 | 포커스 가능한 group의 좌우 화살표 및 이전/다음/건너뛰기 버튼 경로 존재. 양 끝 clamp. UI/스토리 테스트가 기본 경로를 다룸. 실제 스크린리더 검증은 미실행 |
| 동작 감소 설정 | 장 전환·진행 점 transition 및 시작 화면 등장 animation을 reduced-motion에서 제거 |

## 비차단 주의사항 및 미검증 항목

1. **세션 복원과 새 방문 정의** — `src/features/onboarding/model/root-entry.ts:10`의 “브라우저를 닫으면 사라진다”는 보장은 너무 강하다. 브라우저의 이전 세션 복원 기능은 세션 쿠키도 복원할 수 있고 탭만 닫는 것은 쿠키 세션 종료가 아니다. e2e의 `browser.newContext()`는 깨끗한 저장소 테스트로, 기존 프로필 재시작을 증명하지 않는다. 세션 쿠키 선택 자체는 사용자 결정대로 구현되었다. 문서에는 브라우저 세션 정책에 따른다고 명시하고 실제 프로필 복원 조건을 별도 확인할 것을 권고한다.
2. **RSC 캐시** — `useOnboarding.ts:31`–`:35`의 document.cookie 변경 자체는 Next Router Cache 무효화 신호가 아니다. 다만 `/`는 동적이고 staleTimes 사용자 설정이 없으며, 제공된 e2e에는 실제 시작 화면에서 출발해 replace 후 홈을 확인하는 경로가 있어 단순히 refresh가 없다는 이유로 버그 판정하지 않았다. production/OpenNext에서 prefetch·뒤로가기/앞으로가기·쿠키 변경이 결합된 경로는 미검증이다. 재현 시 서버 쿠키 변경/캐시 무효화 또는 확실한 새 요청 경로를 검토한다.
3. **성능** — `/`는 Full Route Cache의 정적 HTML 제공 대신 요청별 Worker 렌더가 필요해졌다. 쿠키 읽기에 새 백엔드 호출은 없지만 비용이 0은 아니며 cold start/TTFB/Worker CPU 영향은 별도 측정 대상이다. 제공된 `/` 588507B, `/onboarding` 587952B 및 번들 예산 통과는 클라이언트 번들 증거이고 SSR 비용 증거는 아니다. proxy 미도입은 2026-10-06 배포 SDD와 일치한다.
4. **문서 정합성** — `domain/home.md`는 `/`가 곧 홈이며 세션 분기를 넣지 않는다고 설명한다. 실제 홈 widget/feature는 세션 판단을 소유하지 않고 onboarding 서버 계층이 담당하므로 구조 위반으로 판정하지 않았다. 도메인 문서에 루트 진입 owner 변경을 반영하는 후속 정리가 필요하다. `intent/active/index.md`에도 이번 작업이 아직 없다.
5. **Story 범위** — onboarding feature stories는 `guides/storybook.md`의 feature 전용 wizard 비대상 규정과 긴장 관계가 있다. 이번 task가 carousel play 등을 명시적으로 포함하므로 승인된 작업 의도를 우선한다. shared SiteFooter story는 위치와 props 계약을 준수한다.

## 구조 / VSA

- widgets/onboarding은 auth/onboarding 공개 API만 사용한다. onboarding에서 다른 feature 내부로 향하는 import는 없다.
- 일반 feature barrel과 `server/index.ts`가 분리되어 있고 서버 엔트리 및 구현에 `import "server-only"`가 있다. cookies/인증 쿠키 읽기가 client graph로 재수출되지 않는다.
- 상태·라우팅은 hooks, 순수 전이/쿠키 문자열은 model, document.cookie는 lib에 있다. 신규 영역에 useEffect는 없다. UI는 핸들러와 접근성 속성을 연결한다.
- SiteFooter는 home/start 두 화면에서 재사용하며 문구는 호출부가 전달한다. KakaoLoginButton의 기존 md 기본값을 유지하고 시작 화면만 lg를 쓴다.
- root/onboarding page, feature 및 widget, shared 문구/푸터/토큰, 번들 baseline, 신규 6개 e2e와 기존 홈 테스트의 guest 전제 변경을 확인했다.

## 증거와 실행 결과

- 직접 실행: `git status --short`, `git diff origin/develop -- frontend`, 신규 파일 직접 읽기, `git diff --check origin/develop -- frontend` (출력 없음), import/useEffect 검색.
- 직접 실행(frontend cwd): `./node_modules/.bin/vitest run src/features/onboarding/test src/features/auth/test/server-auth.test.ts` → **3 files / 26 tests passed**, exit 0. 순수 진입/쿠키/장 이동 및 기존 auth 서버 쿠키 정리 계약 범위다.
- 직접 계산: 흰 배경과 #8a8a8a/#a8a8a8의 WCAG 상대휘도 대비 → 3.4522201871 / 2.3778655892.
- 사용자 제공 완료 결과: unit 891, Storybook Vitest 121, tsc, eslint, build, 번들 예산, e2e 85 통과. 이번 세션에서 전체 명령을 재실행한 결과와 구분한다.
- 전체 tsc/eslint/build/Storybook/번들 재실행: `not_run`. 코드 변경 없는 리뷰에서 제공된 결과와 관련 단위 테스트·구조 검토를 사용했다.
- e2e 재실행: `not_run`. 저장소의 명시적 실행 요청 규칙에 따라 제공된 결과와 테스트 소스를 검토했다.
- 실제 브라우저 대비/스크린리더/터치/세션 복원/운영 Workers 성능 및 production RSC 캐시: `not_run`; 위 한계 참조.
- Evidence Gate: 기본 경로 증거는 존재하지만 F1/F2가 남아 최종 승인 불가. Failure taxonomy: `implementation_bug`; 부가적으로 `doc_mismatch`, 운영 조건 `missing_evidence`/`performance_risk`.

## 기준 문서와 적용

- Intent source: `.agents/intent/{prd,sdd,tasks}/2026-10-15-onboarding.md` — 첫 진입 분기, 세션 둘러보기, 3장 이동, 기존 회원 홈 유지의 acceptance 기준.
- `.agents/intent/sdd/2026-10-06-cloudflare-opennext.md` — proxy 부재를 결함으로 보지 않는 근거 및 Worker 성능 검토.
- `AGENTS.MD`, `CLAUDE.md`, `.agents/README.md`, `context/README.md`, `intent/README.md`, `intent/active/index.md` — 방식 A 및 필요한 문서 선택, 코드 수정 없는 검증 범위.
- `.agents/agents/validation.md`, `harness/README.md`, `reports/README.md` — 증거 출처 구분 및 최종 리포트.
- `guides/accessibility.md` — 키보드/이름/상태/포커스 검토. `client-logic-separation.md` — hook/model/UI 책임. `server-client-boundary.md`, `bff.md` — server-only, 쿠키, 인증 경계. `storybook.md` — 공용 푸터 및 story 검토.
- `domain/home.md`, `domain/login.md`, `domain/withdraw.md` — 홈 책임, 로그인 목적지, 탈퇴 후 인증 정리 맥락.
- 로컬 skills `verification-before-completion`, `next-best-practices`(RSC/async 참조 포함), `vercel-react-best-practices` — 직접 실행 증거 구분, await cookies/서버 경계, 추가 fetch와 요청별 렌더 비용 검토.
- 제외: 사람용 `.agents/onboarding.md`, 무관한 course/saved 도메인 상세 및 디자인 재설계 자료. `guides/performance.md`는 파일이 없어 배포 SDD/설정으로 대체했다.
- 충돌 처리: 사용자 요청의 판정 명칭을 우선하고 저장소 용어를 병기했다. 소스 수정 금지 준수. 별도 승인 질문 없이 이미 제공된 의도를 적용했다.

## 실행 루프 및 다음 게이트

- Full Loop의 validation/report 단계, 리뷰 1회. 구현 인계는 사용자 메시지와 tasks의 완료 목록을 사용했다. Evidence bundle: Validation + UI/BFF 관련 부분 검토.
- 수정 문서: 이 리포트 1개. 구현 수정·추가 테스트 작성·커밋·배포 없음.
- 다음 게이트: F1 대비 수정, F2 수직 우세/취소 제스처 처리 및 관련 검증 후 재리뷰. 운영 캐시/세션 복원/TTFB는 완료했다고 간주하지 말고 별도 스모크 증거로 남긴다.

## 재검증

- 일자: 2026-10-15, 리뷰 2회차. **최신 판정: approve** (저장소 용어 대응: `approved_with_notes`). 위 최초 `changes-requested` 판정을 이 절의 결과로 갱신한다. 최초 리뷰 내용은 이력으로 보존한다.
- 범위: F1·F2 및 비차단 1·4 수정 확인. 기존 PRD/SDD/tasks와 접근성·클라이언트 로직 분리·서버 경계 기준을 유지했다. 코드 수정 없이 이 절만 추가했다.

### 발견 사항 처리

| 항목 | 재검증 근거 | 결과 |
| --- | --- | --- |
| F1 · P2 대비 | `src/app/globals.css:78`의 `--color-text-subtle`이 #767676. `StartHero.module.css:55`, `OnboardingCarousel.module.css:44`, `:98`에서 시작 설명·활성 건너뛰기·온보딩 설명이 동일 토큰 사용. 흰 배경 대비 직접 재계산 **4.5422249596:1**, 일반 텍스트 AA 4.5:1 이상 | 해결 |
| F2 · P2 스와이프 | `hooks/useOnboarding.ts:51`–`:72`에서 단일 touch의 x/y/identifier 저장, 동일 identifier의 changedTouches 선택, 종료·취소 시 ref 정리. `OnboardingCarousel.tsx:47`에 onTouchCancel 바인딩. `model/onboarding-steps.ts:28`–`:32`에서 `abs(dy) >= abs(dx)`이면 유지하고 기존 수평 거리/양 끝 제한 유지. 키보드는 dy 기본값 0과 ±Infinity로 기존 동작 유지 | 해결 |
| 비차단 1 · 세션 수명 설명 | `model/root-entry.ts:10`–`:13`에서 브라우저 세션 정책, 탭 닫기와 세션 복원 시 쿠키 잔존 가능성을 명시 | 설명 수정 확인 |
| 비차단 4 · 도메인/색인 | `.agents/domain/home.md:28`부터 루트 분기 owner를 onboarding 서버 계층으로 구분하고 홈 widget/feature의 세션 비소유를 명시. `.agents/intent/active/index.md:4`에 #230 현재 작업 추가 | 해결 |

- 추가 단위 테스트는 하나의 test case 안에서 수직 우세(-60,-300), 축 이동량 동률(-60,60), 수평 우세(-80,30)를 검증한다. 전체 단위 테스트 개수가 891→892인 것과 일치한다.
- `src/e2e/onboarding/onboarding.spec.ts:84`–`:100`에서 Y 좌표를 받도록 합성 터치를 확장하고 `(300,500)→(240,200)` 후 현재 장 유지 assertion을 추가한 것을 직접 확인했다.
- 다중 touch·identifier 불일치·touchcancel은 코드 경로로 확인했다. 해당 조건의 브라우저 자동화 테스트나 실제 터치 기기 검증까지 수행했다고 주장하지 않는다. 이번 수정에서 새 승인 차단 사항은 발견하지 않았다.

### 재검증 증거

- 직접 실행: `git status --short`, 관련 diff/신규 파일 직접 읽기, `git diff --check origin/develop -- frontend` (오류 없음), 토큰 사용처 검색 및 sRGB 대비 재계산.
- 직접 실행(frontend cwd): `./node_modules/.bin/vitest run src/features/onboarding/test src/features/auth/test/server-auth.test.ts` → **3 files / 27 tests passed**, exit 0.
- 사용자 제공 재실행 결과: **unit 892 · Storybook 121 · tsc · eslint · build · 번들 예산 · e2e 85 통과**. 전체 suite와 e2e는 이번 리뷰에서 재실행하지 않았으며, 직접 실행한 27건과 출처를 구분한다.
- Evidence Gate: 최초 수정 요청 F1/F2가 해소되어 리뷰 승인. 구조 및 보안 판정은 최초 리뷰와 동일하다.

### 남은 한계

- 비차단 2(RSC 캐시)·3(Worker 동적 렌더 성능)는 기존 문서화된 한계로 유지한다. 사용자가 PR 본문에 스모크 항목으로 남겼다고 제공했으며, 이번 리뷰는 외부 PR 본문을 직접 조회하지 않았다.
- production/OpenNext에서 종료 후 홈 표시, prefetch·히스토리 이동 조합, 세션 복원 및 TTFB/Worker CPU는 사용자 스모크/측정 대상이다. 이번 **approve는 코드 리뷰 게이트 승인**이며 해당 운영 검증이 완료됐다는 뜻은 아니다.
- 최초 비차단 5의 story 범위는 승인된 task 의도 우선이라는 기존 판단을 유지한다.
