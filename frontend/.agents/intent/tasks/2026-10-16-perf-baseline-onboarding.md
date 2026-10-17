# 성능 ① 기준 측정 — 온보딩 `/onboarding/`

## Task Meta
- task_id: 2026-10-16-perf-baseline-onboarding
- date: 2026-10-16
- owner: Claude (성능 개선 캠페인)
- status: review
- task_type: 측정
- issue: Dayro-dev/dayro#240
- branch: `perf/baseline-onboarding`

## 측정 조건
- Lighthouse 13.5.0 모바일 시뮬레이션(412×823 · 느린 4G · CPU 4배) · HeadlessChrome 155 · 각 5회 중앙값
- 운영: `https://day-ro.com/onboarding/` (main `bb94989` 배포본)
- 로컬: develop `fc8104f` `next build` + `next start`(모의 백엔드), `http://127.0.0.1:3126/onboarding/`
- 쿠키 없음 (비회원 첫 진입 → 시작 화면 → 온보딩 흐름)

## 결과 (중앙값)
| 환경 | 점수 | FCP | LCP | TBT | CLS | SI | TTFB | JS 전송 | 안 쓰는 JS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 운영 | 87 | 2538 ms | 3711 ms | 12 ms | 0 | 3635 ms | 720 ms | 194.5 KiB | 55.2 KiB |
| 로컬 | 97 | 907 ms | 2615 ms | 5 ms | 0 | 907 ms | 2 ms | 186.8 KiB | 54.0 KiB |

- 운영 회차별 점수 74 · 75 · 97 · 91 · 87, LCP 1894~5586 ms, TTFB 169~1471 ms → 편차 큼
- LCP 요소: 5회 모두 첫 슬라이드 제목 `h1.OnboardingCarousel-module__title` (운영 · 로컬 동일)
- 운영 대표 회차 LCP 세부: TTFB 275 ms · 요소 렌더 지연 1270 ms (텍스트라 리소스 로드 없음)
- 안 쓰는 JS 55.2 KiB — 지금까지 측정한 화면 중 가장 큼 (`/` 27 KiB · `/course/new/` 25 KiB), 두 청크 30 · 25 KiB
- 경고(운영): 렌더링 차단 CSS · 캐시 수명 · 오래된 JS · 네트워크 의존 트리 · 안 쓰는 JS
- 번들 `/onboarding` 첫 로드 JS 574.9 KiB(압축 전): `/` 와 구성 거의 같음 — next 78.9% · shared/ui 7.0% · zod 6.6% · features/auth 2.1% · features/onboarding 1.4%

## 산출물
- `.agents/reports/perf/2026-10-16-onboarding-{prod,local}/summary.{md,json}`
- `.agents/reports/perf/2026-10-16-bundle/routes.md` · `sme-onboarding.json`
- 스크린샷 · 대표 보고서 · trace 는 노션 성능개선 TASK 행 (git 제외)

## 다음
- ② 진단: 제목(텍스트) LCP 인데 요소 렌더 지연 1.27초인 이유 · 안 쓰는 JS 55 KiB 출처 · 운영 TTFB 편차 · 렌더링 차단 CSS · 오래된 JS
