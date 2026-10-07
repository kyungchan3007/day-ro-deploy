# Handoff - 2026-10-05-marketing-attribution (라운드 3: 번들 예산)

## Meta (기본 정보)
- date: 2026-10-05
- from: Claude
- to: Codex
- from_runtime: Claude Code (desktop)
- to_runtime: Codex MCP (`npx -y @openai/codex@0.153.4 mcp-server`)
- coordinator: Claude
- mcp_status: Codex 사용량 한도 도달 — "try again at 6:31 PM"(2026-10-05) → file-based handoff 전환
- current_stage: Validate → Implement 재진입 (번들 예산 FAIL)
- handoff_reason: validation_reentry
- next_mode: Codex 재연결 시 이 문서를 입력으로 라운드 3 구현 (기존 thread `01a10a8e-e42f-7102-81a3-b2e043f7b4f6`)

## Ownership (소유권)
- implementation_owner: Codex
- validation_owner: Codex (빌드·번들 수치는 Claude가 로컬 측정 — Codex 샌드박스는 Google Fonts DNS·Storybook 포트 EPERM으로 불가)
- review_owner: Claude
- gate_owner: Codex
- claimed_scope: `frontend/src/shared/analytics/**`, `frontend/src/features/auth`의 analytics 보조 진입점·AuthEvent 소비, `frontend/src/app/layout.tsx`, 관련 테스트, SDD "로딩 전략" 단락, validation report 라운드 3

## Completed (완료된 내용)
- 라운드 1: GA4·Meta Pixel·first-touch·이벤트 7종·카카오 콜백 쿠키·`docs/analytics-setup.md` 구현
- 라운드 2(Claude 리뷰 반영): 배럴 import 제거(보조 public 진입점), 다중 행·한국어 JSDoc, config public index 경유, stub 초기화 후 Script 렌더, `COURSE_RETRY_LIMIT` 상수
- Claude 담당: 개인정보처리방침 6항(`shared/static/legal`), `docs/marketing-utm-guide.md`
- Claude 로컬 evidence(라운드 2 후): lint 0 errors(기존 warning 2) · tsc OK · unit 633 pass / 2 fail(FAQ contact-form 타임아웃, develop baseline 동일) · build OK

## Remaining Acceptance Criteria (남은 완료 조건)
- should(사실상 CI gate): 라우트 first-load JS 증가가 예산 정책 범위 내(baseline 상향 없이)
  - 현재 FAIL: `/ui-preview/colors` 529,092 > 528,476 (baseline 518,114 + max(10KiB, 2%)), 약 600B 초과
  - 전 라우트 Δ ≈ +10,966 ~ +12,594 (10KiB 하한 근접)
- 이후: Codex 최종 validation 판정, e2e(사용자 지시 시), GA DebugView·Meta 수신·Lighthouse(ID 발급 후 사용자)

## Open Risks (미해결 리스크)
- 원인: `.next/static/chunks/2w_9-8nb9piro.js`(14,355B) 한 청크에 분석 런타임 전체(`dayro_first_touch`·`dayro-ga`·`dayro_auth_event`)와 `next/script` 런타임(`beforeInteractive`)이 root first-load로 포함
- 비동기 위임 전환 시 이벤트 순서·page_location 캡처 시점·비투척 보장 회귀 위험

## Required Evidence (필요한 증거)
- lint · tsc · 관련 단위 테스트 (Codex)
- `npm run build` + `node scripts/check-route-bundle-budget.mjs` 전 라우트 통과, 라우트별 Δ 표 (Claude 측정)

## Handoff Contract (인계 계약)
- input_artifacts: `intent/sdd|tasks/2026-10-05-marketing-attribution.md`, `reports/validation/2026-10-05-marketing-attribution.md`, 이 문서
- output_expected:
  1. root client leaf 최소화 — pathname 구독 + 활성 gate만 정적 포함, 활성일 때만 분석 런타임을 동적 `import()`로 지연 로드(비활성 환경에서는 import 없음)
  2. `next/script` 제거 검토 — 공식 스니펫처럼 stub 초기화 후 `<script async src>` 1회 직접 주입(중복 방지·실패 격리), 유지 시 근거·수치
  3. feature용 `trackEvent` 시그니처 유지, gate 통과 시 지연 런타임에 위임 — 호출 시점 URL·타임스탬프 동기 캡처, 호출 순서 보존, 비투척
  4. 목표: root first-load 증가 ≈ 1~2KB 이하
  5. SDD "로딩 전략" 단락 추가, validation report 라운드 3 기록
- evidence_required: 위 Required Evidence
- must_not_change: SDD 계약(활성 gate가 전역 객체 생성 전, 공식 stub + 초기화 선행, `/login` Meta 미발행, first_utm GA 전용, 쿠키 소비 순서, page view 중복 억제), `scripts/route-bundle-baseline.json`, `src/shared/static/legal/index.ts`, `docs/marketing-utm-guide.md`
- recursive_call_allowed: no (Codex는 Claude를 재호출하지 않음)

## Next Recommended Action (다음 권장 액션)
- 2026-10-05 18:31 이후 Codex thread `01a10a8e-e42f-7102-81a3-b2e043f7b4f6`에 이 문서 경로를 넘겨 라운드 3 진행 → Claude 빌드·번들 재측정 → Codex 최종 판정 → 커밋·PR

## 업데이트 (2026-10-05, Claude)
- 확인 결과: Codex가 사용량 한도 응답 전에 라운드 3 구현을 이미 반영(소스 mtime 15:02 > Claude 빌드 14:59)
  - root leaf 최소화 + `scheduleAnalytics` 순차 체인 + `import("./runtime")` 지연 로드, `next/script` 제거 → `scripts.ts`가 stub 초기화 후 `<script async>` 1회 주입, SDD "로딩 전략" 단락 추가
  - 미완료로 남은 부분: `src/shared/analytics/test/scripts.test.ts`가 옛 `<Script>` 렌더 기준(tsc 오류 3건, 테스트 5건 실패)
- 사용자 지시("Claude가 먼저 구현, 검증은 다른 세션")로 Claude가 `scripts.test.ts`를 새 계약 기준으로 재작성 — 비활성 무주입, stub 초기화 후 1회 주입, `/login` Meta 미주입, 초기화 실패 벤더 제외, DOM 주입 실패 격리
- Claude evidence: lint 0 errors(기존 warning 2) · tsc OK · unit 636 pass / 2 fail(FAQ 기존 불안정) · build OK · **route bundle budget 통과** (Δ /course/new +3,236, /saved +1,824, 나머지 +1,608~1,620 — 라운드 2 대비 약 −9.4KB)
- 검증: Codex 대신 독립 검증 세션(Claude 서브에이전트, ValidationAgent 역할)으로 진행 — 규칙(비즈니스 로직 검증=Codex owner)과 다른 점은 사용자 지시로 승인됨
