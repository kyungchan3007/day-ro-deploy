# Handoff - 2026-09-13-zod-mini-contract-followup

## Meta (기본 정보)
- date: 2026-09-13
- from: Claude
- to: Codex
- from_runtime: Claude Code (desktop)
- to_runtime: Codex CLI (MCP `codex`)
- coordinator: Claude
- mcp_status: call_failed — `codex-reply` (threadId `01a09a10-335c-7b71-81f6-02a0d23b2743`) 호출 시 "You've hit your usage limit ... try again at 10:46 PM" (2026-09-13)
- current_stage: 1차 구현 완료·판정 rejected → 보강 구현·재검증 미착수
- handoff_reason: mcp_call_failed (usage limit)
- next_mode: 한도 해제 후 같은 threadId로 `codex-reply` 재발송 (아래 "Codex 요청 원문" 그대로)

## Ownership (소유권)
- implementation_owner: Codex
- validation_owner: Codex
- review_owner: Codex
- gate_owner: 사용자 (commit·push는 원 세션 "성능 개선"이 diff 검토 후 수행)
- claimed_scope: `frontend/eslint.config.mjs`, `scripts/test/zod-import-policy.test.mjs`, `scripts/route-bundle-baseline.json`, `src/shared/api/openapi/test/mini-locale.test.ts`, `src/features/auth/hooks/useAuthSession.ts`, `src/widgets/situation/hooks/useSituationFlowController.ts`(경로 확인), validation report·run log

## Completed (완료된 내용)
- 1차 구현(Codex): 계약 mini 전환, 배열 사용처 2곳, 서버 `$ZodError` 판별 2곳, 동등성 312건·locale·BFF 매핑 테스트, ESLint 경로 차단, 예산 스크립트·CI workflow. 판정 rejected(build 실측·전체 lint·E2E 미충족). 근거: `.agents/reports/validation/2026-09-13-zod-mini-contract.md`
- 원 세션 로컬 확인(샌드박스 밖):
  - `import { z } from "zod/mini"` 빌드는 라우트당 -17,776B(-2%), zod 청크 271,058B 잔존. 원인: `z` 네임스페이스 객체가 locales·toJSONSchema·core 유지(`node_modules/zod/v4/mini/external.js:1,6,7`)
  - 3개 파일을 `import * as z from "zod/mini"`로 변경(`src/shared/api/openapi/dayro.openapi.ts`, `src/features/situation/model/url-state.ts`, `src/features/course-map/lib/selected-course-storage.ts`)
  - 결과: `/`·`/login` 등 629,063~629,629B(-28.1%), `/course/new` 668,043B(-26.9%), `/saved`·`/saved/[id]` 699,011B(-26.0%), `/_not-found`·`/ui-preview/*` 변화 없음. zod 청크 43,278B, toJSONSchema·타 언어 문자열 없음, 영어 locale 메시지 prod 청크 보존. tsc 0, unit 33파일/459건 통과, 변경 파일 eslint 0
  - 현재 `frontend/.next`는 이 빌드 산출물

## Codex 요청 원문 (사용자 결정)
1. 재발 방지 lint: `zod/mini`는 `import * as z from "zod/mini"`만 허용, named/default import 금지(`no-restricted-syntax` 등, 사유 메시지 포함). `scripts/test/zod-import-policy.test.mjs`에 케이스 추가. `src/shared/api/openapi/test/mini-locale.test.ts:2`의 `import { config }` 정리(locale 테스트 의미 유지).
2. 번들 예산 baseline 확정: `npm run build` 재실행 → `scripts/route-bundle-baseline.json` 실측값 확정(`measurementStatus: measured`), classic before / named-import / 최종 after와 사유를 report에 기록. `node scripts/check-route-bundle-budget.mjs` 통과. build 정체 시 우회 금지·사유 기록.
3. CI lint 기존 오류: `.claude/skills/**` ESLint 제외. 앱 코드 `react-hooks/set-state-in-effect` 2건(`useAuthSession.ts:36`, `useSituationFlowController.ts:148`) 동작 불변 수정(eslint-disable 금지, 회귀 테스트). `npm run lint` 전체 0 error.
4. e2e: `npm run test:e2e:ci` 실행 허용(Playwright webServer 기동만 허용 — 원 세션 경유 사용자 허락). 샌드박스 제약 실패 시 우회 금지·로그 기록.

## Remaining Acceptance Criteria (남은 완료 조건)
- `frontend/.agents/intent/tasks/2026-09-13-zod-mini-contract.md` AC 전체 재검증
- validation report 갱신·재판정(approved / approved_with_notes / rejected), run log 갱신
- 최종 명령: `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`(가능 범위), `npm run build`, `node scripts/check-route-bundle-budget.mjs`, `npm run test:e2e:ci`
- report에 `.agents/guides/performance.md`가 `frontend/.gitignore:47`로 무시되어 커밋되지 않음을 명시

## Open Risks (미해결 리스크)
- 샌드박스 build 정체 재발 가능(next/font/google 네트워크 추정) → 원 세션 로컬 build 산출물 사용 가능 여부 판단 필요
- 현재 상태로 push 시 CI 예산 체크(baseline pending)·lint 단계 실패
- branch protection 필수 체크 지정 미확인

## Handoff Contract (인계 계약)
- input_artifacts: 이 파일, 위 intent/report 경로
- output_expected: 보강 구현 + 갱신된 validation report·재판정
- must_not_change: intent 결정, 후속 task(BFF 400 오분류·UI raw 메시지) 미구현, commit/push 금지, `npm run dev`/`npm run start` 수동 기동 금지
- recursive_call_allowed: false

## Next Recommended Action (다음 권장 액션)
- 22:46 이후 Claude가 threadId `01a09a10-335c-7b71-81f6-02a0d23b2743`로 위 요청 재발송 (cwd=repo 루트, workspace-write, approval-policy=never)
- 또는 사용자가 Codex CLI에서 이 파일을 직접 전달
