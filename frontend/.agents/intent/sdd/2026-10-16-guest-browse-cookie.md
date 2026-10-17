# 둘러보기 쿠키 유효기간 · 로그아웃 삭제 SDD

## Meta
- sdd_id: 2026-10-16-guest-browse-cookie
- date: 2026-10-16
- owner: Claude
- status: approved(user decisions)
- issue: Dayro-dev/dayro#244

## 유효기간
- `features/onboarding/model/root-entry`
  - `GUEST_BROWSE_MAX_AGE_SECONDS = 60 * 60 * 24`
  - `buildGuestBrowseCookie()` → `dayro_guest_browse=1; path=/; Max-Age=86400; SameSite=Lax` (+https Secure)
- `Max-Age` 사용 (Expires 보다 우선 · 기기 시계 영향 적음)
- 쓰는 곳은 그대로: 온보딩 건너뛰기 · 시작하기 → `markGuestBrowse()`

## 로그아웃 삭제
- 위치: 로그아웃 BFF `app/api/auth/logout/route.ts` 응답에서 만료
  - 클라이언트 `features/auth` 훅에서 지우면 features → features(onboarding) 교차 참조 → VSA 위반
  - 서버 응답 Set-Cookie 는 fetch 응답이어도 브라우저에 반영됨 · 백엔드 로그아웃 실패여도 항상 실행(인증 쿠키 정리와 같은 자리)
- `features/onboarding/server/expire-guest-browse-cookie.ts`
  - `expireGuestBrowseCookie(response)` → `response.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax" })`
  - `features/onboarding/server` 배럴(server-only)로 공개 — app route 는 features 공개 API 만 사용
- 쿠키 이름 · 경로는 model 한 곳에서만 정의 (발급 · 만료 같은 원본)

## 사이트를 닫았는지 판단 (2차)
- 쿠키만으로는 탭 · 브라우저 종료를 알 수 없음 (세션 쿠키도 세션 복원 시 남음)
- 이번 탭 표시 `sessionStorage["dayro_guest_visit"] = "1"` (탭을 닫으면 브라우저가 지움)
	- `markGuestBrowse()` 가 쿠키와 함께 기록
- visit guard: 루트 레이아웃 `<head>` 인라인 스크립트(`model/root-entry.buildGuestVisitGuardScript`)
	- 둘러보기 쿠키가 있는데 탭 표시가 없음 → 닫았다 온 방문 → 쿠키 삭제
	- 그때 경로가 `/` 면 서버가 이미 홈을 그렸으므로 `visibility:hidden` + `location.replace` → 시작 화면 (홈 깜빡임 없음)
	- 다른 경로면 쿠키만 삭제 → 이후 `/` 진입 시 시작 화면
	- 저장소 접근 불가 환경은 아무것도 안 함 (24시간 규칙만)
- 배치: `features/onboarding/ui/GuestVisitGuard` → `features/onboarding/server` 배럴로 공개
	- 기본 배럴(클라이언트 컴포넌트 포함)로 내보내면 루트 레이아웃 때문에 모든 라우트 번들에 온보딩 UI 가 들어가 `/share/course` 번들 예산 초과 → server 배럴로 분리
- 판단 기준
	- 닫은 것으로 봄: 탭 · 브라우저 종료 후 재방문, 새 탭에 주소 직접 입력
	- 닫지 않은 것으로 봄: 같은 탭 새로고침 · 이동, 사이트 안 링크로 연 새 탭, 모바일 앱 전환, 브라우저 탭 복원

## 로그아웃 복귀 유지 (2026-10-17, #181 규칙)
- `useAccountMenu.logoutAndReturn`: 화면 상태 맡기기(onBeforeLogin) + `resolveLoginReturnPath` 로 직전 화면 계산 → `useLogout(nextPath)`
- `useLogout`: 성공 시 `buildStartScreenPath(nextPath)` = `/` 또는 `/?next=<인코딩 경로>` (`shared/lib/login-redirect`)
- `app/page.tsx`: 비회원이면 `sanitizeLoginNextPath(next)` 검증 값만 `StartScreen next` → `KakaoLoginForm next`(base64url hidden input) → 로그인 뒤 그 화면
- 홈 · 로그인 화면에서 로그아웃하면 돌아갈 곳이 없어 `/`
- e2e: 상황입력 중 로그아웃 → 시작 화면(`?next=` 지역 단계) → 카카오 로그인 → 지역 단계 · 새 탭으로 next 열면 단계 · 입력 복원

## 4차 구조 (2026-10-17, 최종) — 서버 쿠키 없이 탭별 판단
- Codex 3차 지적: 탭이 공유하는 둘러보기 쿠키 때문에 ① 기존 탭 복구가 새 탭의 SPA 이동 온보딩을 건너뜀 ② 다른 탭이 로그아웃으로 지운 쿠키를 되살림 ③ 자연 만료 뒤 홈을 다시 받지 않음
- 원인은 "탭마다 다른 상태를 모든 탭이 공유하는 쿠키로 서버에 알린 것" → 쿠키 제거
- 비회원 `/`: 서버가 시작 화면 · 홈을 함께 내려보냄(`app/page.tsx`), `<html data-guest-visit="on">` 이면 CSS(`globals.css`)가 홈, 아니면 시작 화면
	- 기본(스크립트 · 저장소 없음)은 시작 화면
	- 회원은 홈만
- 판단 함수 `model/guest-visit.runGuestVisitGuard(cfg)` — 탭 표시 `{ startedAt, lastActiveAt }` 만 봄
	- 30분 안에 썼고 24시간 안 → 속성 "on" + 마지막 사용 시각 갱신
	- 그 밖(표시 없음 · 깨짐 · 오래됨) → 표시 삭제 · 속성 제거
	- `<head>` 인라인 guard(그리기 전, toString) + `GuestVisitTracker`(화면 이동 · 탭 복귀 · 사용 중 1분 간격)
	- 결과가 속성으로만 반영 → 서버 화면 다시 받기 · location.replace · router.refresh 없음
- `markGuestBrowse()`: 속성 "on" 먼저 + 탭 표시 기록 (저장소 막혀도 이번 화면은 홈)
- 로그아웃: `clearGuestVisitMarker()` 가 이번 탭 표시 · 속성 삭제 (`shared/lib/guest-visit-marker`), BFF 는 원래대로(인증 쿠키만)
- `<html suppressHydrationWarning>`: guard 가 그리기 전 속성을 거는 것은 의도된 차이
- 비용: 비회원 `/` HTML 에 숨은 화면이 함께 내려옴 (그림은 지연 로드로 막음) — 시작 화면 성능은 캠페인 ⑤ 재측정에서 확인
- 숨은 화면 부수효과 처리 (Codex 4차)
	- `SideMenu` 닫힌 드로어 `inert` — body 포털이라 숨은 홈 밖에 있어 Tab 순서에 남던 문제 (기존 회원 홈에도 있던 접근성 문제 함께 해결)
	- 둘러보기 중이던 탭의 방문 종료 시 guard 가 `dayro:guest-visit-ended` 이벤트 → `useAccountMenu` 가 열린 메뉴 · 확인창 닫음
	- 비회원 `/` 의 숨은 홈은 `HomeScreen imagePriority={false}` → 첫 카드 그림 지연 로드(숨은 동안 받지 않음), 회원 홈은 그대로 우선 로드
	- tracker 동작은 `hooks/useGuestVisitTracker` 로 분리(UI 는 붙이기만), scroll · pointerdown 은 capture 로 받음(스크롤 영역 main 의 scroll 은 버블링 안 됨)
- 제거: `dayro_guest_browse` 쿠키 · `expireGuestBrowseCookie` · 로그아웃 route 변경(develop 과 같음)
- e2e: 비회원 `/` 는 두 화면이 함께 있어 "붙어 있음" 대신 "보임/숨김"으로 확인, `main:visible`

## 3차 구조 (2026-10-17, 4차로 대체)
- 탭 표시 값: `{ startedAt, lastActiveAt }` JSON (키는 `shared/lib/guest-visit-marker` — 로그아웃(features/auth)도 지워야 해서 shared)
- 판단 함수 하나 `features/onboarding/model/guest-visit.runGuestVisitGuard(cfg, firstLoad)`
	- 인라인 guard: `Function.prototype.toString` 으로 같은 함수를 `<head>` 스크립트에 넣음 (규칙 중복 없음, 자기완결 · 전역만 사용)
	- 클라이언트 `GuestVisitTracker`(루트 레이아웃): 화면 이동 · 탭 복귀(visible) · 사용(터치 · 키 · 스크롤, 1분 간격) 때 실행
- 결과
	- 표시 없음 + 쿠키 있음: 첫 로드에서만 expire (새 방문 탭이 화면 이동 때마다 공유 쿠키를 지우지 않게)
	- 표시 있음 + 30분 넘게 미사용 또는 24시간 경과: expire
	- 표시 있음 + 쿠키 없음(다른 탭이 지움): restore — 남은 시간(24시간 − 경과)만큼 쿠키 복구
	- 표시 있음 + 쿠키 있음: touch(마지막 사용 시각 갱신)
	- `/` 화면이 바뀌어야 하면 첫 로드는 숨김 + `location.replace`, 화면 이동 · 탭 복귀는 `router.refresh()`
- 탭을 떠나는 순간(pagehide · hidden)은 판단하지 않음 — 새로고침 요청이 먼저 나가 쿠키 정리와 어긋남(e2e 로 확인)
- 공개 진입점 `features/onboarding/visit.ts` (루트 레이아웃 전용, `features/auth/analytics` 와 같은 방식) — 기본 배럴은 클라이언트 UI 가 섞여 모든 라우트 번들에 포함됨
- 로그아웃 성공 시 `clearGuestVisitMarker()` — 표시가 남으면 guard 가 쿠키를 되살림
- 번들: tracker 가 모든 라우트에 약 2.7KB 추가 → `/share/course` 687370B / 예산 688926B (여유 작음)

## 로그아웃 이동 (2차)
- `features/auth/hooks/useLogout`: 성공 시 `router.replace("/")` + `refresh()` (예전 `/login?notice=logged_out&next=…`)
- (2026-10-17 정정) 로그아웃 때 화면 상태 맡기기 · 돌아올 경로 계산은 유지 — 아래 "로그아웃 복귀 유지"

## 테스트
- unit: `root-entry.test` 쿠키 문자열 Max-Age · `expire-guest-browse-cookie.test` 만료 Set-Cookie
- unit: `guest-visit-guard.test` (닫았다 온 `/` · 다른 경로 · 같은 탭 · 쿠키 없음 · http · 저장소 차단)
- e2e: 쿠키 24시간 · 로그아웃 → 바로 `/` 시작 화면 · 같은 탭 유지 · 새 탭 재방문 시작 화면 · 다른 화면으로 재방문 시 쿠키 삭제 · 상황입력 중 로그아웃 → 시작 화면
- e2e 헬퍼 `browseAsGuest`: 쿠키 + 탭 표시(addInitScript)
