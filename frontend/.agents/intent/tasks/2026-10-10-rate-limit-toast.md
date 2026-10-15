# 코스 생성·재추천 429 원인별 안내

## Task Meta
- task_id: 2026-10-10-rate-limit-toast
- date: 2026-10-10
- owner: Claude(구현)
- status: done (독립 검증 대기)
- task_type: 기능 수정
- linked_prd: `intent/prd/2026-10-10-rate-limit-toast.md`
- linked_sdd: `intent/sdd/2026-10-10-rate-limit-toast.md`
- branch: `feat/#161-rate-limit-toast`

## Acceptance Criteria
- must: 429 + 서버 메시지 → 그 문구로 토스트 (생성 · 재추천)
- must: 429 + 메시지 없음(HTML) → "요청이 너무 많아요. 10초 후 다시 시도해주세요."
- must: 5xx · 네트워크 실패 → 기존 문구
- must: 화면 이동 · 남은 횟수 유지 규칙 기존과 동일
- must: 기존 저장 상태(failureMessage 없음) 복원 호환

## Evidence Result
- unit 신규
  - `features/situation/test/generation-failure.test.ts` 6건 — JSON 429 문구 보존 · HTML 차단 페이지 무시 · 빈·200자 초과 문구 무시 · 429 문구/기본 안내/그 밖 undefined
  - `generation-events.test.ts` 2건 — 429 실패 기록에 문구 저장 · 새로고침 복원 시 재전송 없이 같은 문구 · 재추천 429 서버 문구
  - `course-flow.test.ts` 1건 — failureMessage 보존 · 기존 저장값(문구 없음) 호환
  - `useCourseFlowRedirects.test.ts` 3건 — 재추천 실패 문구 + 결과 유지 · 생성 실패 문구 + purpose · 중단 안내 우선
- 전체 unit 94 파일 · 787 통과 (storybook 포함)
- lint 0 errors (기존 경고 2건, 변경 파일 무관) · tsc 통과 · build 통과
- 번들 예산 통과 — `/course/new` 620,592B (limit 681,403B)
- e2e (사용자 지시 2026-10-10): `course-rate-limit.spec.ts` 4건 신규
  - 생성 + Cloudflare 차단(429 HTML) → "요청이 너무 많아요. 10초 후 다시 시도해주세요." · 목적 단계 · 기존 문구 미노출
  - 생성 + 백엔드 하루 한도(429 JSON) → 백엔드 문구 · 목적 단계
  - 재추천 + Cloudflare 차단 → 차단 안내 · 결과 · 첫 후보 · 남은 횟수 유지 → 해제 후 재추천 시 남은 횟수 1 감소
  - 재추천 + 백엔드 재추천 한도(429 JSON) → 백엔드 문구 · 결과 유지
  - 수정 전 코드에서 4건 모두 실패 확인
  - 회귀: `course-retry-failure.spec.ts` 1건 · `course-new.spec.ts` 2건 통과 (총 7/7)
  - 환경: 별도 worktree, e2e 포트 3110 · 목 백엔드 18090
- 작업 환경: 별도 worktree, 개발 서버 미실행
