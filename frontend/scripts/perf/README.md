# 성능 측정 도구 (scripts/perf, issue #234)

전 화면 성능 개선 캠페인용. 같은 조건으로 반복 측정하고, 증거(표 · 보고서 · 스크린샷)를 남긴다.

## 설치된 도구
- `lighthouse` 13.5.0 (devDependency, 버전 고정) — 구글 공식 성능 측정 CLI
- `source-map-explorer` 2.5.3 (devDependency, 버전 고정) — 소스맵 기반 번들 트리맵 (빌드 도구 무관 현업 표준)
- Turbopack 번들 분석기 — Next 16 내장 `next experimental-analyze` (설치 불필요, 실제 배포 번들 기준)
  - `@next/bundle-analyzer`(webpack-bundle-analyzer)는 webpack 빌드 전용이라 쓰지 않는다 (이 프로젝트는 Turbopack 빌드)

## 측정 조건 (고정)
- Lighthouse 기본 모바일 시뮬레이션: 화면 412×823 · 느린 4G(simulate) · CPU 4배 느리게
- 성능 카테고리만, 헤드리스 크롬, 회차마다 새 브라우저(캐시 없음)
- 기본 5회 → 지표별 중앙값 + 대표 회차(점수 중앙값에 가장 가까운 회차, 같으면 LCP 중앙값에 가까운 회차)

## 사용법
```bash
# 1) 반복 측정 — 운영
npm run perf:measure -- --url https://day-ro.com/ --name home --env prod
# 1) 반복 측정 — 로컬 운영 빌드 (npm run build && npm run start 로 띄운 뒤)
npm run perf:measure -- --url http://127.0.0.1:3000/ --name home --env local

# 2) 증거 스크린샷 (대표 회차 보고서에서 잘라 찍기 + 회차 표 이미지)
npm run perf:shots -- --dir .agents/reports/perf/<날짜>-home-prod

# 3) 번들 분석 (라우트 여러 개 가능, --skip-build 로 분석용 빌드 재사용)
npm run perf:bundle -- --route / --route /course/new
```

## 결과 폴더 `.agents/reports/perf/<날짜>-<화면>-<환경>/`
| 파일 | 내용 | git |
| --- | --- | --- |
| `summary.md` · `summary.json` | 회차별 · 중앙값 표, 측정 조건 | 커밋 |
| `representative.report.html/json` | 대표 회차 Lighthouse 보고서 | 제외 (용량) |
| `representative.trace.json` | 대표 회차 trace — 크롬 DevTools 성능 패널에서 열기 | 제외 |
| `raw/` | 회차별 보고서 · trace · devtools log | 제외 |
| `shots/` | 증거 스크린샷 (노션 성능개선 TASK 행에 올림) | 제외 |

번들 분석 `.agents/reports/perf/<날짜>-bundle/`: `routes.md`(라우트별 상위 묶음 표, 커밋) · `sme-*.json` · `shots/turbopack-*.png` · `shots/sme-*.png`

## 스크린샷 목록 (`perf:shots`)
- `00-runs-table` 회차별 · 중앙값 표
- `01-score` 점수 · `02-metrics` 지표 · `03-filmstrip` 로딩 필름스트립
- `04-insights` 인사이트(펼침) · `05-diagnostics` 진단(펼침)
- `10-NN-<항목>` 경고 · 실패 항목 하나씩 (근거 표 포함)

## 분석용 빌드
- `PERF_SOURCEMAPS=1` 이면 `next.config.ts` 가 `distDir: ".next-perf"` · `productionBrowserSourceMaps: true` 로 빌드 → 운영 `.next` · 배포 결과물에는 소스맵이 들어가지 않는다
- `tsconfig.json` 의 `.next-perf/types` include 는 Next 가 분석용 빌드 때 자동으로 넣는 줄을 미리 넣어 둔 것(파일 재작성 방지)

## 알려진 점
- `next experimental-analyze -o` 실행 중 Turbopack 내부 경고(`nft.rs` panic)가 한 번 출력되지만 분석 결과는 정상 생성된다 (실험 기능)
- INP 는 사용자 상호작용 지표라 이 측정(첫 로딩)에서는 나오지 않는다 → TBT 로 대신 보고, 필요하면 상호작용 시나리오로 따로 측정
