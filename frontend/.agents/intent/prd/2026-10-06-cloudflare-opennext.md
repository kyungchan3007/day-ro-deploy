# Cloudflare Workers(OpenNext) 배포 구성 PRD

## Meta
- prd_id: 2026-10-06-cloudflare-opennext
- date: 2026-10-06
- owner: Claude(구현, 사용자 지시) · 검증: 별도 세션(Codex 사용량 없음)
- issue: Dayro-dev/dayro#146

## Problem
- FE 운영 배포 대상 Cloudflare Workers 결정, 도메인·SSL 대시보드 설정 완료 → 코드에 Workers 배포 구성 없음
- `src/proxy.ts`(Next 16 Node 미들웨어) = OpenNext 에서 실험 기능("공식 관리 안 함") 경고
- `proxy.ts` 포함 시 Worker 압축 크기 3,004KiB → 무료 플랜 한도 3MB(3,072KiB)의 98%

## Goal
- `opennextjs-cloudflare build` 로 Workers 배포 산출물 생성
- Worker 크기를 무료 한도 안에서 여유 있게 유지
- 보호 화면 세션 복구·`/ui-preview` 404 동작을 공식 지원 범위로 유지

## In Scope
- `@opennextjs/cloudflare`·`wrangler` 설치, `wrangler.jsonc`, `open-next.config.ts`, `cf:*` scripts
- `public/_headers` 정적 자산 캐시, `.gitignore`·eslint ignore, `.dev.vars.example`
- `proxy.ts` 제거 → Server Component 가드 + 세션 복구 Route Handler, ui-preview layout 404
- `next.config.ts` GitHub Pages 분기 제거(미사용)

## Out of Scope
- Cloudflare 대시보드 4~9단계(Worker 생성·환경변수·도메인 연결·WAF) — 사용자 진행
- 배포 CI workflow(Workers Builds 가 GitHub 연동으로 빌드)
- CSP 강제 전환, HSTS
