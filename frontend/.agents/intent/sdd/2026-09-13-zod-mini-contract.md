# API 계약 zod/mini 전환 및 번들 재발 방지 SDD

## Meta
- sdd_id: 2026-09-13-zod-mini-contract
- date: 2026-09-13
- owner: Codex (구현·검증), Claude (coordinator)
- status: active
- supersedes: -
- superseded_by: -

## Scope Path
- affected routes: zod 계약을 사용하는 전 라우트(first-load 기준 11개) + BFF route handlers
- affected slices: `shared/api/openapi/dayro.openapi.ts`, `shared/api/server-*.ts`, `app/api/situations/route.ts`, `features/{auth,situation,saved,course-map,course-result}`의 `api`/`model`/`lib`, `eslint.config.mjs`, `scripts/`(예산 스크립트), `.github/workflows/frontend-quality.yml`, `.agents/guides/performance.md`
- related guides: `.agents/guides/performance.md`, `.agents/guides/bff.md`
- related domains: auth, course-situation, course-result, course-map, saved

## Design Decisions
- SSR/BFF/client boundary: 변경 없음. 브라우저는 BFF만 호출, 브라우저·서버 모두 같은 계약 스키마로 검증하는 기존 정책 유지.
- public API boundary: 계약 export 이름·타입(`z.infer` 결과) 유지. 스키마 정의 문법만 classic 체인 → mini 함수형(`z.optional`, `z.nullable`, `.check(z.minLength())` 등). nullable/optional 중첩 순서와 시간 regex 형식 검사 보존.
- 제네릭 헬퍼: `makeApiResponseSchema`는 `T extends z.ZodMiniType` + `z.extend(meta, { data })`, 반환 타입은 추론 유지.
- locale: 계약 모듈 top-level, 스키마 선언 전에 `import en from "zod/v4/locales/en.js"; z.config(en());`(`.js` 확장자 필수). bare-import 초기화 모듈 분리·`PURE` 주석 금지.
- 에러 판별: 서버 `instanceof ZodError`(classic) → `zod/v4/core`의 `$ZodError`. HTTP 상태 매핑 등 동작은 불변(400 오분류 수정은 후속).
- shared promotion decision: 신규 공용 승격 없음. 도메인별 계약 분할(대안 B)은 보류.
- orchestration owner: 변경 없음(기존 훅·api 함수 유지).
- 재발 방지:
  - ESLint `no-restricted-imports` 금지: `zod`, `zod/v3`, `zod/v4`, `zod/v4/classic/**`, `zod/v4-mini`, `zod/v4/mini`, `zod/locales`, `zod/v4/locales`(단 `zod/v4/locales/en.js`는 허용). 허용 진입점: `zod/mini`, `zod/v4/core`, `zod/v4/locales/en.js`.
  - 예산 스크립트 `scripts/check-route-bundle-budget.mjs`: `.next/diagnostics/route-bundle-stats.json` 기반 라우트별 `firstLoadUncompressedJsBytes`를 baseline과 비교, 한도 `baseline + max(10KiB, 2%)`. 라우트 집합 불일치·청크 파일 누락·합계 불일치·stats 파일 부재 시 실패. baseline은 수동 갱신만(사유·before/after 기록).
  - CI: `frontend-quality.yml`에 `npm run lint` → `npm run build` → 예산 검사 추가, 경로 필터에 workflow 파일 포함.

## Data / Contract Notes
- request path: 변경 없음.
- response path: 변경 없음. parse 결과(unknown key 제거 포함)·issue code/path/message 동일해야 함.
- model/view-model decision: 변경 없음.

## Risks
- `z.config` 전역 설정의 prod 초기화 보존(빌드 후 실측).
- `dayroOpenApi` 집계 객체로 인한 tree-shaking 제한 → 절감량 실측으로 판단, 부족 시 대안 B 후속 검토.
- 동등성 테스트에서 classic을 같은 런타임에 import하면 영어 locale이 자동 설정돼 mini 초기화 누락을 가림 → classic 기대값 고정 후 mini 단독 테스트로 분리.
- 예산 스크립트가 Next 내부 stats 포맷에 의존(버전 업 시 깨질 수 있음) → 포맷 부재 시 명시적 실패.
- branch protection 필수 체크 지정은 저장소 설정(사람이 확인).

## Validation Notes
- what must be reviewed: 계약 동작 동등성, 서버 에러 매핑 불변, lint 정책 누락/과차단, 예산 스크립트 실패 케이스, CI 트리거.
- expected evidence: tsc/lint 0, unit(기존+동등성+locale) 통과, prod build 전후 라우트별 first-load bytes, `test:e2e:ci` 통과, validation report `.agents/reports/validation/2026-09-13-zod-mini-contract.md`. Coverage·Lighthouse는 사용자 측정.
