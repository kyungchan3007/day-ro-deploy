# 성능 측정 도구 도입 (Lighthouse CLI · 반복 측정 · 증거 스크린샷 · 번들 분석)

## Task Meta
- task_id: 2026-10-15-perf-tooling
- date: 2026-10-15
- owner: Claude (사용자 지시: 성능 개선 캠페인 ⓪ 도구 · 환경 준비)
- status: review
- task_type: 도구 · 설정
- issue: Dayro-dev/dayro#234
- branch: `chore/perf-tooling`

## 결정 (사용자)
- 측정: 운영 + 로컬 운영 빌드, 모바일만, 목표는 화면별로 측정 후
- Lighthouse CLI 는 프로젝트 devDependency(재현성 · CI 연결)
- 번들: Turbopack 내장 분석기 + source-map-explorer (size-limit 은 ⑥ 회귀 방지 단계)
- 증거 스크린샷을 단계마다 남김, 설치 · 설정 포함 전부 노션 기록

## 진행
- [x] `lighthouse@13.5.0` · `source-map-explorer@2.5.3` devDependency (--save-exact)
  - 13.5.0 = 2026-09-18 배포 최신 안정판, source-map-explorer 2.5.3 = 최신
  - `npm audit` 설치 전후 동일 (고위험 8 — eslint-config-next · wrangler · sharp 등 기존)
- [x] 앱 `zod` 를 `^4.4.3` → `4.4.3` 고정
  - 이유: lighthouse → puppeteer-core → chromium-bidi 가 zod `^4.6.5` 를 요구 → npm 이 앱 zod 까지 4.6.7 로 올림 → `/share/course` · `/saved` 첫 로드 JS 704,153B 로 번들 예산(688,926B) 초과
  - 고정 후 앱은 4.4.3, chromium-bidi 는 자기 폴더에 4.6.7 (앱 번들 영향 없음, 번들 예산 통과)
- [x] `scripts/perf/lib.mjs` 지표 추출 · 중앙값 · 대표 회차 · 표 + `scripts/test/perf-lib.test.mjs`
- [x] `measure.mjs` · `shots.mjs` · `bundle.mjs`, npm scripts `perf:measure` · `perf:shots` · `perf:bundle`
- [x] `next.config.ts` 분석용 빌드(PERF_SOURCEMAPS) · `tsconfig.json` include · `.gitignore`
- [x] 시험 실행: 운영 `/` 2회 측정 · 스크린샷 12장 · 번들 `/` · `/course/new` 분석

## Checks
- `node --test scripts/test/*.test.mjs` 46 pass · tsc · eslint · build · 번들 예산
