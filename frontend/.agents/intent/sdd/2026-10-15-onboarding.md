# 첫 진입 시작 화면 · 온보딩 SDD

## Meta
- sdd_id: 2026-10-15-onboarding
- date: 2026-10-15
- owner: Claude
- status: approved(user decisions)
- issue: Dayro-dev/dayro#230

## 진입 분기
- `proxy.ts` 없음(2026-10-06 Worker 용량 결정) → `app/page.tsx` 서버 컴포넌트가 분기
  - `features/onboarding/server/getRootEntry()`: `cookies()` 로 access · refresh · `dayro_guest_browse` 존재만 확인
  - 규칙 `model/root-entry.resolveRootEntry`: 로그인 쿠키 → home, 둘러보기 쿠키 "1" → home, 그 밖 → start
  - 백엔드 호출 없음 · 만료 토큰이면 홈 계정 메뉴가 비로그인 표시(기존 홈과 동일)
- 영향: `/` 가 정적(○) → 동적(ƒ). 쿠키만 읽어 렌더 비용 작음, 깜빡임 없음(클라이언트 분기 대비)

## 둘러보기 기록
- `dayro_guest_browse=1; path=/; SameSite=Lax` (+https Secure), 만료 없음 = 세션 쿠키
- 온보딩 건너뛰기 · 시작하기에서 `lib/guest-browse-cookie.markGuestBrowse()` → `router.replace("/")`

## 슬라이스
- `features/onboarding`
  - model: root-entry · onboarding-steps(moveNext/movePrev/swipeTarget, 스와이프 50px)
  - hooks: useOnboarding (장 index · 이동 · 스와이프 · 화살표 키 · 종료)
  - ui: StartHero · GuestBrowseLink · OnboardingCarousel · OnboardingVisuals(꾸밈, aria-hidden)
  - server: getRootEntry (server-only 배럴 분리)
- `widgets/onboarding`: StartScreen(StartHero + 카카오 로그인 form + 둘러보기 + SiteFooter) · OnboardingScreen
- `shared/static/onboarding`: 문구(강조 조각 배열), `shared/static/site`: 푸터 문구(home 에서 이동)
- `shared/ui/layout/SiteFooter`: 홈 푸터 승격(홈 · 시작 화면 2곳)
- `features/auth/KakaoLoginButton`: `size="lg"`(52px · 심볼+문구 가운데 · 16px) 추가, 기본 md 유지

## 접근성
- 지금 장이 아닌 장은 `inert` + aria-hidden, 진행은 sr-only aria-live("3장 중 n번째")
- 장 영역 group + 화살표 키, 버튼 focus-visible, prefers-reduced-motion 시 전환 · 등장 애니메이션 없음

## 토큰 추가
- 색: primary-gradient-end · primary-tint · primary-deep · surface-muted · surface-chip · border-soft · indicator-idle · text-subtle
- 글자 `text-display 24` · radius `tile 16` · 그림자 `brand` · 모션 `duration-slide/rise` · `ease-slide`

## 번들 예산
- 새 라우트 `/onboarding` 587952B 기준 추가 (`/` 588507B, 기존 기준 629629B 이내)
