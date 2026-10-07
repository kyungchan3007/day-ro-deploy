# API 계약 zod/mini 전환 및 번들 재발 방지

## Task Meta
- task_id: 2026-09-13-zod-mini-contract
- date: 2026-09-13
- owner: Codex (구현·검증), Claude (coordinator)
- task_type: 성능 + 공용 계약 리팩터 + 품질 게이트
- linked_prd: 2026-09-13-zod-mini-contract
- linked_sdd: 2026-09-13-zod-mini-contract

## Intent Brief
- 사용자 목표: 검증 정책·동작을 유지하면서 zod classic을 클라이언트 번들에서 제거하고 재발을 자동 차단한다(유지보수성·정석적 안정성 우선).
- 포함 범위: 계약 mini 전환, 사용처·서버 에러 판별 조정, 동등성·locale 테스트, ESLint 정책, 번들 예산 스크립트·baseline, CI 보강, performance.md.
- 제외 범위: BFF upstream 400 오분류, UI raw zod 메시지, 계약 도메인 분할, 클라이언트 검증 제거.
- 관련 도메인: auth, course-situation, course-result, course-map, saved.
- 위험: locale 전역 설정 prod 보존, 실제 절감량, CI 필수 체크 미지정.

## Solution Notes
- 결정 근거: `.agents/reports/handoffs/2026-09-13-zod-client-bundle-debate.md` Round 2 합의.
- 관련 guide: performance, bff.

## Acceptance Criteria
- must: 계약·런타임 사용처에서 zod classic 진입점 import 0건(`zod/mini`, `zod/v4/core`, `zod/v4/locales/en.js`만).
- must: 계약 export 이름과 추론 타입 유지, tsc 0.
- must: classic↔mini 동등성 테스트 통과 — 성공 여부·파싱 결과(unknown key 제거)·issue code/path/message 동일. 케이스: 정상, 잘못된 200 응답, null/누락, unknown key, 정수 범위, UUID, 길이 경계, 시간 regex, 저장소 복원 실패.
- must: classic 미import 독립 테스트에서 mini 기본 에러 메시지가 영어 locale 메시지다.
- must: 서버 BFF 에러 HTTP 상태 매핑 동작 불변.
- must: ESLint가 금지 진입점 import 시 실패, 허용 진입점은 통과.
- must: 예산 스크립트가 예산 초과·라우트 누락·청크 누락·합계 불일치·stats 부재에서 실패하고 현재 빌드에서 통과.
- must: `frontend-quality.yml`에 lint·build·예산 검사 추가, workflow 파일 변경도 트리거.
- must: 기존 unit·`test:e2e:ci` 통과.
- must not: 브라우저→BFF 경계, 요청/응답 계약 형태, 훅/화면 동작 변경. dev 서버(3000 포트) 기동.
- should: prod build에서 zod 관련 first-load bytes 감소를 라우트별로 확인(`/course/new` 913,599B 기준 비율).

## Boundary Decisions
- 사용자 확인: 2026-09-13 토론(2라운드) 종합안 채택, "zod까지 하고 push" 지시.

## Evidence Plan (구현 순서, `frontend/`에서 실행)
1. 기준 확보: `npm run test:unit -- src/features/{auth,situation,course-map,saved,course-result}/test`, `npm run build`(라우트별 first-load bytes 기록), classic 기대값 고정.
2. mini 전환·locale·제네릭·배열 사용처·`$ZodError`: `npx tsc --noEmit`, `npm run lint`, 1단계 unit.
3. 동등성·locale 테스트 + prod 빌드 bytes 비교: `npm run test:unit`, `npm run build`.
4. ESLint 정책·예산 스크립트·baseline·workflow·performance.md: `npm run lint`, `npm run build`, `node scripts/check-route-bundle-budget.mjs`(실패 케이스 포함).
5. 최종: `npx tsc --noEmit`, `npm run test:e2e:ci`.
- required review: Codex validation report `.agents/reports/validation/2026-09-13-zod-mini-contract.md`, Claude diff 검토 후 커밋. Coverage·Lighthouse는 사용자 측정.

## Open Questions / Follow-up
- 후속 task: BFF 요청/upstream 응답 검증 분리(upstream 계약 오류 502), UI raw zod 메시지 노출 개선.
- 절감량 부족 시 계약 도메인별 분할(대안 B) 검토.
- GitHub branch protection에서 frontend-quality 필수 체크 지정 여부(사람 확인).
