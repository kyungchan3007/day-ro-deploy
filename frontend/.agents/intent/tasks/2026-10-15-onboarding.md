# 첫 진입 시작 화면 · 온보딩 (QA #25)

## Task Meta
- task_id: 2026-10-15-onboarding
- date: 2026-10-15
- owner: Claude(UI 구현)
- status: review
- task_type: 기능 (UI · 진입 분기)
- linked_prd: prd/2026-10-15-onboarding.md
- linked_sdd: sdd/2026-10-15-onboarding.md
- branch: `feat/#230-onboarding`

## 진행
- [x] 시안 분석 (시작 · 온보딩 3장), 사용자 결정 4건
- [x] 토큰 추가 · 목록 동기화
- [x] features/onboarding (model · hooks · ui · server) · widgets/onboarding · `/` 분기 · `/onboarding`
- [x] SiteFooter 승격 · KakaoLoginButton lg
- [x] 단위 테스트 (진입 규칙 · 쿠키 문자열 · 장 이동 · 스와이프)
- [x] e2e 신규 6건 + 홈 관련 기존 5건을 "둘러보기 비회원"으로 갱신
- [x] 스토리 (StartHero · OnboardingCarousel play · Visuals · SiteFooter)
- [x] 시안 대비 스크린샷 비교
- [x] Codex 검증 2라운드 → approve (`reports/validation/2026-10-15-onboarding.md`)
  - F1 설명 · 건너뛰기 대비 3.45 · 2.38:1 → text-subtle #767676 (4.54:1)
  - F2 세로 우세 손짓 장 넘김 → x·y·손가락 id 추적, 가로 우세만 전환, touchcancel 정리
  - 문서: home 도메인 루트 분기 owner · active 색인 · 세션 쿠키 주석

## Checks
- unit 892 · storybook vitest 121 · tsc · eslint 오류 0
- next build · 번들 예산 통과 (`/` 588507B · `/onboarding` 587952B)
- e2e 전체 85 passed (신규 onboarding 6건)

## 운영 스모크 (사용자)
- 비회원 `/` 시작 화면 → 둘러보기 → 시작하기 → 홈, 뒤로가기 · 다시 `/` 에서 시작 화면이 다시 뜨지 않는지 (RSC 캐시)
- 카카오 로그인 → 홈, 로그아웃 후 `/` → 시작 화면
- `/` TTFB (정적 → 동적 전환)
