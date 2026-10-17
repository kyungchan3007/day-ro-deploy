# 성능 ① 기준 측정 — 첫 화면 `/` (시작 화면 · 홈)

## Task Meta
- task_id: 2026-10-15-perf-baseline-home
- date: 2026-10-15
- owner: Claude (성능 개선 캠페인)
- status: review
- task_type: 측정
- issue: Dayro-dev/dayro#236
- branch: `perf/baseline-home`

## 측정 조건
- Lighthouse 13.5.0 모바일 시뮬레이션(412×823 · 느린 4G · CPU 4배) · HeadlessChrome 155 · benchmarkIndex ≈4160 · 각 5회 중앙값
- 운영: `https://day-ro.com/` (develop = main `2cea270` 기준 배포본)
- 로컬: `perf/baseline-home`(= develop `2cea270`) `next build` + `next start`(모의 백엔드), `http://127.0.0.1:3126/`
- 시작 화면 = 쿠키 없음(비회원), 홈 = `dayro_guest_browse=1` (둘러보기 비회원)

## 결과 (중앙값)
| 화면 · 환경 | 점수 | FCP | LCP | TBT | CLS | SI | TTFB | JS 전송 | 안 쓰는 JS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 시작 · 운영 | 84 | 2124 ms | 4070 ms | 8 ms | 0 | 3120 ms | 647 ms | 218.9 KiB | 29.0 KiB |
| 홈 · 운영 | 84 | 2239 ms | 4074 ms | 14 ms | 0 | 3206 ms | 203 ms | 237.8 KiB | 27.2 KiB |
| 시작 · 로컬 | 96 | 905 ms | 2765 ms | 4 ms | 0 | 905 ms | 5 ms | 214.1 KiB | 28.5 KiB |
| 홈 · 로컬 | 96 | 906 ms | 2764 ms | 3 ms | 0 | 906 ms | 5 ms | 235.6 KiB | 26.7 KiB |

- LCP 요소: 시작 = 푸터 저작권 문구(`p.text-center.text-label.text-text-disabled`), 홈 = 첫 진입 카드 이미지(`img-create.webp`, fetchpriority=high)
- 운영 TTFB 회차 편차 큼 (164~1109 ms)
- 경고(운영 공통): 렌더링 차단 CSS · 오래된 JS · 네트워크 의존 트리 · 캐시 수명 · 안 쓰는 JS, 시작 화면은 이미지 전달, 홈은 bfcache
- 번들 `/` 첫 로드 JS 575.4 KiB(압축 전): next 78.9% · src/shared/ui 6.9% · zod 6.6%(38.0 KiB) · features/auth 2.1% · features/onboarding 1.4%

## 산출물
- `.agents/reports/perf/2026-10-15-{start,home}-{prod,local}/summary.{md,json}`
- `.agents/reports/perf/2026-10-15-bundle/routes.md`
- 스크린샷 · 대표 보고서 · trace 는 노션 성능개선 TASK 행 (git 제외)

## 다음
- ② 진단: 운영 ↔ 로컬 차이(TTFB · 네트워크), 시작 화면 LCP 가 푸터 문구인 이유(소개 영역 등장 애니메이션), 렌더링 차단 CSS, 오래된 JS, zod 가 첫 화면 번들에 들어오는 경로
