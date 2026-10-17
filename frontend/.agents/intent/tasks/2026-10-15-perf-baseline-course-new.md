# 성능 ① 기준 측정 — 상황 입력 `/course/new/` (시간 단계)

## Task Meta
- task_id: 2026-10-15-perf-baseline-course-new
- date: 2026-10-15
- owner: Claude (성능 개선 캠페인)
- status: review
- task_type: 측정
- issue: Dayro-dev/dayro#238
- branch: `perf/baseline-course-new`

## 측정 조건
- Lighthouse 13.5.0 모바일 시뮬레이션(412×823 · 느린 4G · CPU 4배) · HeadlessChrome 155 · benchmarkIndex ≈4150 · 각 5회 중앙값
- 운영: `https://day-ro.com/course/new/` (main `bb94989` 배포본)
- 로컬: develop `ecf8a97` `next build` + `next start`(모의 백엔드), `http://127.0.0.1:3126/course/new/`
- 쿠키 `dayro_guest_browse=1` (홈에서 코스 만들기로 들어오는 둘러보기 흐름)
- `trailingSlash: true` 라 `/course/new` 는 308 → `/course/new/`, 측정은 최종 주소로 함

## 결과 (중앙값)
| 환경 | 점수 | FCP | LCP | TBT | CLS | SI | TTFB | JS 전송 | 안 쓰는 JS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 운영 | 79 | 2210 ms | 4543 ms | 14 ms | 0 | 4287 ms | 950 ms | 213.3 KiB | 25.1 KiB |
| 로컬 | 95 | 906 ms | 2917 ms | 4 ms | 0 | 1197 ms | 8 ms | 208.4 KiB | 24.6 KiB |

- 운영 회차별 점수 77 · 96 · 79 · 84 · 79, LCP 2303~4868 ms, TTFB 229~1260 ms → 편차 큼
- LCP 요소가 회차마다 갈림
  - 운영 1 · 5회: 제목 `h1` / 2 · 3 · 4회: 화면에서 사라진 요소(노드 정보 없음) — 대표 회차 trace 의 LCP 후보 1 = 라우트 로딩 화면 그림 `SituationLoadingScreen` 일러스트(`place-checklist.webp`, 120×119, 우선순위 Low)
  - 로컬 2 · 5회: 제목 `h1` / 1 · 3 · 4회: 노드 정보 없음
- 경고(운영): 문서 응답 지연 · 렌더링 차단 CSS · 오래된 JS · LCP 요청 발견 · 네트워크 의존 트리 · 캐시 수명 · 이미지 전달 · 안 쓰는 JS · bfcache
- 번들 `/course/new` 첫 로드 JS 619.5 KiB(압축 전, `/` 보다 +44.1 KiB): next 73.9% · shared/ui 6.5% · zod 6.1%(38.0 KiB) · features/situation 4.6% · features/auth 2.0% · widgets/situation 1.9% · features/loading-quiz 1.1%
- Turbopack 분석기: polyfill-nomodule 38.5 KB · sortable 5.1 KB · globals.css 14.5 KB 표시
- 운영(main `bb94989`)과 로컬(develop `ecf8a97`)은 코드 버전이 다름 — develop 에 디자인 토큰 · 리팩터(#229 · #233) 반영분 있음

## 산출물
- `.agents/reports/perf/2026-10-15-course-new-{prod,local}/summary.{md,json}`
- `.agents/reports/perf/2026-10-15-bundle/routes.md` (`/` 기존 기록 유지 + `/course/new` 추가) · `sme-course-new.json`
- 스크린샷 · 대표 보고서 · trace 는 노션 성능개선 TASK 행 (git 제외)

## 다음
- ② 진단: 진입 시 라우트 로딩 화면(loading.tsx) 그림이 LCP 로 잡히는 구조 · 운영 TTFB(문서 응답 지연) · 첫 로드에 loading-quiz · zod 포함 경로 · 렌더링 차단 CSS · 오래된 JS(polyfill)
