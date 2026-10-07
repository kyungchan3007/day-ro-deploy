# Cloudflare Workers(OpenNext) 배포 구성

## Task Meta
- task_id: 2026-10-06-cloudflare-opennext
- date: 2026-10-06
- owner: Claude(구현) · 검증: 별도 세션
- status: done(구현) · 독립 검증 대기
- task_type: 배포 구성 + 인증 경계 이전
- linked_prd: `intent/prd/2026-10-06-cloudflare-opennext.md`
- linked_sdd: `intent/sdd/2026-10-06-cloudflare-opennext.md`
- branch: `chore/#146-cloudflare-opennext`

## Acceptance Criteria
- must: `npm run cf:build` 성공, Node 미들웨어 경고 없음
- must: Worker gzip 크기 무료 한도(3,072KiB) 대비 여유(목표 2,000KiB 이하)
- must: refresh token 만 남은 사용자가 `/mypage`·`/saved`·`/saved/[id]` 진입 시 세션 복구 후 원래 화면
- must: 토큰 거절 시 쿠키 정리 + 로그인, 백엔드 장애 시 쿠키 유지 + 로그인
- must: 복구 경로 `next`는 내부 경로만(외부·`/api`·`/login` → `/`)
- must: 운영 빌드 `/ui-preview/**` 404
- must: lint / tsc / unit / build / 번들 예산

## Evidence Result
- cf:build 성공 · wrangler dry-run gzip 1,737.45KiB (proxy 포함 시 3,004.35KiB)
- unit: 전체 93 files / 775 tests 통과
  - 복구 Route Handler 5건(성공·거절·장애·refresh 없음·외부 next)
  - 가드 4건(`session-restore-guard.test.ts`: 복구 경로·로그인·거절 시 루프 없음·정상)
  - ui-preview layout 운영 404·개발 통과
- build: `/ui-preview`·`/ui-preview/colors` `.meta` status 404
- lint 0 errors · tsc · 번들 예산 통과(`/` 574,209B · `/saved` 643,204B)
- e2e: 미실행(사용자 지시 시)
- 사용자 확인 필요: `npm run cf:preview` 로컬 Workers 스모크
