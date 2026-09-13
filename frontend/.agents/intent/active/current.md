# 현재 의도

## 작업
- `2026-09-13-zod-mini-contract` — API 계약 zod/mini 전환 + ESLint zod 진입점 정책 + 번들 예산 CI gate.
  - 완료 조건: `intent/tasks/2026-09-13-zod-mini-contract.md` Acceptance Criteria 전부, validation report `reports/validation/2026-09-13-zod-mini-contract.md`.
  - 문서: `intent/prd|sdd|tasks/2026-09-13-zod-mini-contract.md`, 결정 근거 `reports/handoffs/2026-09-13-zod-client-bundle-debate.md`
  - owner: Codex(구현·검증), Claude(coordinator·diff 검토·커밋)
- 이어서: `27jktro2p5rq9.js`·CSS 청크 미사용 분석(조사 단계).

## 직전 완료
- `2026-09-13-remove-unused-geist-mono` (커밋 `ee85f6a`) — 미사용 Geist Mono preload 제거.

## 다음 작업 시작하면
- 이 파일에 task_id·의도 요약·완료 조건을 적고, `active/index.md`에 연결한다.
- medium/large(API·경계·파일 3+·다세션)면 `intent/sdd`·`intent/tasks` 파일을 만든다(커밋 전 완성, pre-push 훅이 강제).
