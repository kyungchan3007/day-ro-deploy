# 현재 의도

## 작업
- `2026-10-06-cloudflare-opennext` — Cloudflare Workers(OpenNext) 배포 구성 + `proxy.ts` 제거(세션 복구 Route Handler·ui-preview layout 404).
  - 완료 조건: `intent/tasks/2026-10-06-cloudflare-opennext.md` Acceptance Criteria 전부.
  - 문서: `intent/prd|sdd|tasks/2026-10-06-cloudflare-opennext.md`
  - owner: Claude(구현), 검증: 별도 세션(Codex 사용량 없음) — `reports/handoffs/2026-10-06-cloudflare-opennext.md`
- 이어서: Cloudflare 대시보드 4~9단계(사용자) → 환경 보안 점검.

## 직전 완료
- `2026-10-05-retry-limit-notice` (issue #126, PR#127 머지 `c1b75b7`) — 다른 코스 보기 한도 소진 시 aria-disabled 유지·안내 토스트, `useCourseReroll` 분리.
- `2026-09-13-zod-mini-contract` (커밋 `618a28c`) — API 계약 zod/mini 전환 + 번들 예산 CI gate.

## 다음 작업 시작하면
- 이 파일에 task_id·의도 요약·완료 조건을 적고, `active/index.md`에 연결한다.
- medium/large(API·경계·파일 3+·다세션)면 `intent/sdd`·`intent/tasks` 파일을 만든다(커밋 전 완성, pre-push 훅이 강제).
