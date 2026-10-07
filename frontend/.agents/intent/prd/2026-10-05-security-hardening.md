# 배포 전 보안 조치 PRD

## Meta
- prd_id: 2026-10-05-security-hardening
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시) / 독립 검증 세션(검증)
- issue: Dayro-dev/dayro#139
- 입력: `.agents/reports/validation/2026-10-05-security-review.md`

## Problem
- 배포 전 마지막 점검에서 P1 2건(토큰 본문 노출, Next.js critical 취약점), P2 4건(경로 조작, 로그인 문구 위조, 보안 헤더 없음, Secure 쿠키 판정), P3 6건이 나왔다.

## Goal
- P1·P2를 모두 조치하고, P3 중 코드로 처리할 수 있는 항목(S7·S10·S11)을 조치한다.
- 기존 화면 동작·로그인 흐름·번들 예산 회귀 없이 끝낸다.

## In Scope
- S1 refresh BFF 본문 토큰 제거 · S2 Next 16.3.8 + 운영 의존성 취약점 0
- S3 저장 코스 id UUID 검증·인코딩 · S4 로그인 `message` 쿼리 제거 · S5 보안 헤더 · S6 Secure 쿠키
- S7 `APP_ORIGIN` · S10 운영 `BACKEND_API_BASE_URL` 즉시 실패 · S11 운영 `/ui-preview` 404
- S8 BFF 오류 문구·상태코드 정리 · S9 서버 전용 파일 가드(사용자 지시로 같은 PR)

## Out of Scope
- Cloudflare 설정: 요청 빈도 제한(S12), HSTS, Kakao 지도 키 도메인 제한
- 개발 의존성 취약점(빌드 도구, `npm audit fix --force` 필요) — 운영 번들 미포함
- CSP 강제 전환(운영 스모크에서 Report-Only 위반 확인 후)
