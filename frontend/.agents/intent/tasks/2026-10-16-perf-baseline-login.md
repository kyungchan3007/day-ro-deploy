# 성능 ① 기준 측정 — 로그인 `/login/`

## Task Meta
- task_id: 2026-10-16-perf-baseline-login
- date: 2026-10-16
- owner: Claude (성능 개선 캠페인)
- status: review
- task_type: 측정
- issue: Dayro-dev/dayro#242
- branch: `perf/baseline-login` (온보딩 측정 `perf/baseline-onboarding` 위에 쌓음 — 같은 날짜 번들 기록 파일 공유)

## 측정 조건
- Lighthouse 13.5.0 모바일 시뮬레이션(412×823 · 느린 4G · CPU 4배) · HeadlessChrome 155 · 각 5회 중앙값
- 운영: `https://day-ro.com/login/` (main `bb94989` 배포본)
- 로컬: develop `fc8104f` 운영 빌드(`next build` 결과물 그대로) → `next start --port 3126`, **로컬 백엔드(Spring, 8080) 연결** (이전 화면들은 모의 백엔드)
- 쿠키 없음 (비회원)
- `next dev`(개발 서버)는 측정에 쓰지 않음 — 압축 · 번들 최적화가 빠져 수치가 실제와 다름

## 결과 (중앙값)
| 환경 | 점수 | FCP | LCP | TBT | CLS | SI | TTFB | JS 전송 | 안 쓰는 JS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 운영 | 87 | 2066 ms | 3849 ms | 12 ms | 0 | 2691 ms | 822 ms | 191.4 KiB | 29.4 KiB |
| 로컬 | 97 | 907 ms | 2691 ms | 4 ms | 0 | 907 ms | 5 ms | 183.9 KiB | 28.7 KiB |

- 운영 회차별 점수 89 · 83 · 86 · 87 · 87, LCP 3375~4320 ms, TTFB 644~1044 ms — 다른 화면보다 편차 작음
- LCP 요소: 5회 모두(운영 · 로컬) 소개 그림 `img-intro.webp` (300×231, `fetchpriority` 없음, `decoding="async"`)
- 운영 대표 회차 LCP 세부: TTFB 1202 ms · 리소스 로드 지연 4 ms · 리소스 로드 297 ms · 렌더 지연 12 ms
- LCP 요청 발견 인사이트: `fetchpriority=high` 미적용 (첫 문서 발견 · lazy 아님은 통과)
- 이미지 전달 인사이트: 예상 절감 18 KiB (`img-intro.webp`)
- 경고(운영): 문서 응답 지연 · 이미지 전달 · 오래된 JS · 캐시 수명 · 렌더링 차단 CSS · LCP 요청 발견 · 네트워크 의존 트리 · 안 쓰는 JS
- 번들 `/login` 첫 로드 JS 565.2 KiB(압축 전): next 80.3% · shared/ui 7.1% · zod 6.7% · features/auth 2.2%

## 산출물
- `.agents/reports/perf/2026-10-16-login-{prod,local}/summary.{md,json}`
- `.agents/reports/perf/2026-10-16-bundle/routes.md`(온보딩 + 로그인) · `sme-login.json`
- 스크린샷 · 대표 보고서 · trace 는 노션 성능개선 TASK 행 (git 제외)

## 다음
- ② 진단: LCP 그림 우선순위(fetchpriority) · 이미지 전달 18 KiB · 운영 문서 응답 지연 · 렌더링 차단 CSS · 오래된 JS
