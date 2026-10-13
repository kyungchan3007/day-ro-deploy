# Handoff - 2026-09-13-zod-client-bundle

## Meta (기본 정보)
- date: 2026-09-13
- from: Claude
- to: Codex
- from_runtime: Claude Code (desktop)
- to_runtime: Codex CLI (MCP `codex`)
- coordinator: Claude (토론 사회자)
- mcp_status: connected — Round 1·2 모두 별도 Claude 세션의 Codex MCP로 발송 성공(threadId `01a099fe-608e-7671-8071-04372df5d5bc`). 참고 이력: 원 세션은 Codex MCP가 구버전(0.150.1) 프로세스라 호출 불가(모델 400 "requires a newer version of Codex"). 0.154.0 CLI 단독 실행 시 `mcp-server` 서브커맨드가 보이지 않던 문제는 원 세션에서 관찰된 것이며, 재현/원인은 미확인.
- current_stage: 토론 2라운드 완료(2026-09-13) — 종합안 사용자 결정 대기
- handoff_reason: claude_to_codex_architecture (초기 사유: mcp_call_failed, 해소됨)
- next_mode: 사용자 결정 → PRD/SDD/tasks 작성 → 구현(Codex owner)

## Ownership (소유권)
- implementation_owner: Codex (공용 계약·검증 로직)
- validation_owner: Codex
- review_owner: Codex
- gate_owner: 사용자(토론 종합안 최종 결정)
- claimed_scope: `frontend/src/shared/api/openapi/dayro.openapi.ts` 및 클라이언트/서버 zod 사용처, ESLint 설정, 번들 예산 가드, `.agents/guides/performance.md`

## Completed (완료된 내용)
- 측정: prod build `/course/new/` Coverage — `_next/static/chunks/2979ccxw8woip.js` 270,924B 중 221,374B(81.7%) 미사용, 내용은 zod classic 전체(`$ZodError`, `toJSONSchema`, json-schema 2020-12). `route-bundle-stats.json` 기준 15개 라우트 중 11개 first-load 포함.
- Lighthouse 모바일(`/course/new`, 2026-09-13 17:02): Perf 95 / FCP 1.1s / LCP 2.9s(시뮬, 실측 110ms) / TBT 10ms / CLS 0 / SI 1.6s / unused-js 95KiB.
- 사용처 조사: 클라이언트 런타임 `.parse()` — `features/auth/api/{session,logout,withdraw}.ts`, `features/situation/api/submit.ts`, `features/situation/model/request.ts`, `features/saved/api/{delete,update}-saved-course.ts`, `features/saved/model/saved-course-detail.ts`, `features/course-map/{api,model}/save-course.ts`. 서버 `ZodError` instanceof: `app/api/situations/route.ts`, `shared/api/server-course.ts`.
- 계약 파일 사용 API: string/number/object/array/boolean/literal/enum/null, min/max/int/uuid/regex, nullable/optional, extend, z.infer, z.ZodType 제네릭 — zod/mini 전환 가능 범위로 판단(검증 필요).
- 사용자 방향: 유지보수성·재발 방지·정석적 안정성 우선. 진행 방식 = 토론(2라운드).

## Claude 입장 A (Round 1 발송 예정 내용)
1. 계약 파일 전체를 `zod/mini`로 전환(단일 원본 유지, 클라이언트 검증 규칙 유지). 서버 `ZodError` instanceof는 core `$ZodError` 기준으로 조정.
   - 기각: 클라이언트 전용 mini 스키마 별도 작성(이중 관리), 클라이언트 검증 제거(정책 변경), dynamic import(사용처 다수로 효과 미미).
2. 재발 방지 가드: ESLint `no-restricted-imports`로 classic `"zod"` 금지 / `next build` 후 `route-bundle-stats.json` 라우트별 first-load 예산 체크(pre-push 또는 CI) / `performance.md`에 규칙 추가.
3. 검증: tsc/eslint, 스키마 parse·에러 경로 단위 테스트, e2e 영향 스펙, prod build 청크·Coverage·Lighthouse before/after.

## Round 1 결과 (2026-09-13, MCP 연결 성공, threadId `01a099fe-608e-7671-8071-04372df5d5bc`)
- 판정: **A 수정** (mini 단일 계약 전환 동의, 대안 B는 조건부 보류)
- a) 전환 리스크
  - 체인→함수형 변경량: `.min` 34 / `.max` 2 / `.int` 5 / `.nonnegative` 2 / `.uuid` 2 / `.regex` 1 / `.nullable` 38 / `.optional` 11 / `.extend` 2. nullable/optional 중첩 순서 보존, 시간 regex는 형식 검사 그대로 유지(`dayro.openapi.ts:21,43,83,177`).
  - 핸드오프 누락 사용처: `features/course-map/lib/selected-course-storage.ts:40`, `features/situation/model/url-state.ts:181`(`.array()` 교체 필요), `features/course-result/lib/generated-course-storage.ts:43`(회귀 대상).
  - 제네릭: `T extends z.ZodMiniType` + `z.extend(meta, { data })`, 반환 타입 명시 없이 추론 유지(`dayro.openapi.ts:12,264`).
  - 에러 메시지: mini는 영어 locale 자동 설정 안 함 → 기본 메시지가 `"Invalid input"`으로 바뀜. UI가 `error.message` 표시(`useSaveCourseSheet.ts:67`) → locale 명시 설정 + 비용 측정 필요.
  - 에러 타입: 4.4.3 mini parse는 `Error` 상속 `$ZodRealError` 사용 → 판별은 `zod/v4/core` `$ZodError`로(A 유지).
  - 기존 결함: BFF가 요청 검증·upstream 응답 검증을 같은 try에서 처리 → upstream 계약 오류도 400 오분류(`app/api/situations/route.ts:14,18`, `shared/api/server-course.ts:125,136,143,299`). 교체로 해결 안 됨, 별도 동작 변경으로 분리 필요.
  - 테스트 보강: 잘못된 200 응답, null/누락, unknown-key 제거, 정수 범위, UUID, 길이 경계, 저장소 복원 실패.
- b) 감소폭: zod 4.4.3, `sideEffects:false`. 270,924B는 상한일 뿐이고 Coverage 미사용량 ≠ 제거량 → 수치는 mini 빌드로 확정. `dayroOpenApi` 대형 객체 파생 구조가 tree-shaking을 막을 수 있음(`dayro.openapi.ts:94,211`). `/course/new` 비압축 913,599B 기준으로 비율 계산, 공용 청크 절감×11 보고 금지.
- c) 가드: `"zod"`만 금지하면 `zod/v4`, `zod/v4/classic`으로 우회 → classic 진입점 명시 차단(현재 import 제한 없음 `eslint.config.mjs:8`). Next route-bundle-stats는 파일/manifest 누락 시 조용히 스킵(`next/dist/build/route-bundle-stats.js:29,104,118`) → 라우트 집합·청크 존재·합계 검사 필수. CI 필수 gate + pre-push 선택, 초기 예산 후보 `baseline + max(10KiB, 2%)`(측정값 아님), baseline 자동 갱신 금지.
- 대안 B(조건부): mini 전환 후 불필요 스키마 잔존이 확인되면 `shared/api/openapi`를 auth/situation/course 단일 정의 모듈로 분할(집계 객체는 호환 유지). 서버/클라 스키마 복제는 불필요(`.agents/guides/bff.md:32`).
- Round 2 미해결 질문
  1. 오류 정책 유지 범위에 기본 영어 메시지·UI 표시 문자열 포함? → locale 명시 설정 여부
  2. upstream 응답 검증 400 오분류를 이번에 고칠지 / 후속 분리할지
  3. 추가 사용처 3곳 + 잘못된 200 응답·저장소 복원 검증을 범위에 포함할지
  4. 절감 목표를 mini 빌드 실측으로 확정 + CI 가드에 라우트·청크 누락 검사 포함 동의 여부

## Round 2 결과 (2026-09-13, 같은 thread)
### Claude 수정안 A′ (Round 1 질문 답)
1. 영어 locale 명시 설정으로 기존 메시지 유지(비용은 실측에 포함). UI raw 메시지 노출 개선은 후속.
2. BFF upstream 400 오분류는 이번 PR 제외, 별도 후속 task(동작 불변 리팩터 유지).
3. 누락 사용처 3곳 포함 + classic↔mini 동등성 회귀 테스트 포함.
4. 절감 목표는 mini 빌드 실측(`/course/new` 913,599B 기준 비율). ESLint `zod`/`zod/v4`/`zod/v4/classic` 차단. CI 필수 gate 번들 예산(라우트·청크·합계 검사, `baseline + max(10KiB, 2%)`, baseline 수동 갱신만).
5. 도메인별 계약 분할(B)은 실측 후 잔존 확인 시만.

### Codex 최종 응답 B′: **A′ 수용 + 보강**
- locale API(zod 4.4.3): `import { z } from "zod/mini"; import en from "zod/v4/locales/en.js"; z.config(en());` — `.js` 확장자 필수(wildcard exports, `node_modules/zod/package.json:108`), en은 default export(`zod/v4/locales/en.js:109`), classic도 동일 호출(`zod/v4/classic/external.js:8`). 위치: 계약 모듈 top-level, 스키마 선언 전. bare-import 초기화 모듈 분리·`PURE` 주석 금지. `globalThis` 전역 설정 변경이므로(`zod/v4/core/core.js:72`) 요청별 locale엔 부적합, prod tree-shaking 후 초기화 보존은 검증 대상.
- 동등성 테스트: 성공 여부·파싱 결과·issue code/path/message 비교(에러 클래스명·스택 비교 금지). 같은 런타임에 classic을 import하면 영어 locale 자동 설정이 mini 초기화 누락을 가리므로, classic 기대값을 고정한 뒤 **classic 미import 독립 테스트**로 mini 기본 메시지 확인.
- ESLint 목록 보강: 금지 `zod`, `zod/v4`, `zod/v3`(A′ 누락), `zod/v4/classic/**`(방어적) / 진입점 통일 위해 금지 권장 `zod/v4-mini`, `zod/v4/mini`, `zod/locales`, `zod/v4/locales` / 허용 `zod/mini`, `zod/v4/core`, `zod/v4/locales/en.js` (`zod/package.json:52,72,84,90,102`).
- CI: `.github/workflows/frontend-quality.yml` 존재하나 lint·production build 단계 없음(`:34,41,47,50`) → `npm run lint` → `npm run build` → 예산 검사 추가. 경로 필터가 `frontend/**`뿐이라 workflow 파일 변경도 트리거되게 보강(`:8,14`). 필수 체크(branch protection) 지정은 미확인. Playwright는 dev 서버 기반이라 prod tree-shaking 검증 대체 불가(`playwright.config.ts:14`). 예산값은 초기 운영값, baseline 수동 변경 시 사유·before/after 기록.
- B(도메인 분할) 조건부 보류 동의.

### 합의 구현 순서 (`frontend/`에서 실행)
| 단계 | 작업 | 검증 |
|---|---|---|
| 1 | SDD/tasks에 동작 보존 범위·후속 과제 고정, classic 기대값·기준 빌드 확보 | `npm run test:unit -- src/features/{auth,situation,course-map,saved,course-result}/test` · `npm run build` |
| 2 | 계약 mini 전환, locale 초기화, 제네릭·배열 사용처·서버 `$ZodError` 판별 수정 | `npx tsc --noEmit` · `npm run lint` · 1단계 unit |
| 3 | mini 단독 locale 테스트·동등성 회귀 테스트, prod 절감량 측정 | `npm run build` · `npm run start -- --port 3100` 후 Coverage/Lighthouse·라우트별 bytes |
| 4 | ESLint 경로 정책, 예산 스크립트·baseline·workflow·performance.md | `npm run lint` · `npm run build` · (신규) `node scripts/check-route-bundle-budget.mjs` — 초과·라우트 누락·청크 누락·합계 불일치 실패 케이스도 확인 |
| 5 | CI 동일 최종 검증 | `npx tsc --noEmit` · `npm run test:e2e:ci` |

### 남은 불확실성 (구현·측정 증거로 닫을 항목, 추가 토론 불필요)
- 실제 절감량 / prod에서 locale 초기화 보존 / CI 필수 체크 설정 여부

### 후속 task 후보 (이번 범위 밖)
- BFF 요청 검증과 upstream 응답 검증 분리(upstream 계약 오류 502)
- UI raw zod 메시지 노출(`useSaveCourseSheet.ts:67`) 개선

## Codex에 요청할 반박 포인트 (Round 1 발송 기준, 완료)
- zod/mini 에러 메시지·에러 타입 차이, `.extend`/`makeApiResponseSchema` 제네릭 호환, tests·mocks 파급
- mini 전환 시 실제 번들 감소폭 추정
- ESLint 금지 규칙 운영 부담, 번들 예산 스크립트 flaky 여부
- 더 나은 대안 B(VSA/`.agents/agents/architecture.md` 기준)와 근거

## Remaining Acceptance Criteria (남은 완료 조건)
- ~~토론 2라운드 완료~~ (완료) → Claude 종합안 사용자 결정
- 결정안 기준 PRD/SDD/tasks 작성 후 구현·검증

## Open Risks (미해결 리스크)
- ~~zod/mini `ZodError` 호환~~ → `zod/v4/core` `$ZodError` 판별로 합의. 에러 메시지는 `z.config(en())` 명시로 보존하되 prod 빌드에서 초기화 보존 검증 필요
- 번들 예산: 초기 운영값 `baseline + max(10KiB, 2%)` 합의, 빌드 편차 실측으로 조정
- 실제 절감량 미확정(mini 빌드 실측 필요)
- CI 필수 체크(branch protection) 지정 여부 미확인

## Required Evidence (필요한 증거)
- 토론 결과 요약(이 파일 또는 `.agents/reports/`), 결정 후 validation report

## Handoff Contract (인계 계약)
- input_artifacts: 이 파일, 위 경로들
- output_expected: Round 1 반박/대안 B, Round 2 재응답 B′ (둘 다 수신 완료)
- evidence_required: 파일 근거(경로:라인)
- must_not_change: 토론 단계에서는 코드 수정 금지(read-only)
- recursive_call_allowed: false (Claude 재호출 금지, 최대 2라운드)

## Next Recommended Action (다음 권장 액션)
- 사용자: 종합안(Round 2 결과 섹션) 채택 여부 결정
- 채택 시: PRD/SDD/tasks 작성 → 구현 순서 1~5단계를 Codex에 구현·검증 핸드오프(cwd=repo 루트, sandbox=workspace-write, approval-policy=never, validation report 필수)
- 후속 task 분리 등록: BFF upstream 오류 분류, UI raw zod 메시지 노출
- (별건) 원 세션 Codex MCP 프로세스 구버전 문제 — 세션 재시작으로 해소 여부 확인
