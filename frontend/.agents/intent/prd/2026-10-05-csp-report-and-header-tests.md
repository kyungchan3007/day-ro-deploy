# CSP 위반 수집·보안 헤더 테스트 PRD

## Meta
- prd_id: 2026-10-05-csp-report-and-header-tests
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시)
- issue: Dayro-dev/dayro#141

## Problem
- #139 Report-Only CSP 위반이 사용자 브라우저 콘솔에만 표시 → 운영 수집 불가 → 강제 전환 판단 근거 없음
- 보안 헤더 6종 자동 검사 테스트 없음 → 설정 변경 시 헤더 누락을 CI가 못 잡음

## Goal
- CSP 위반을 서버에서 수집(기본 BFF 로그, 선택 외부 수집처)
- 보안 헤더 설정·실제 응답을 단위·e2e로 검증

## In Scope
- `report-uri`·`report-to`·`Reporting-Endpoints`
- BFF `/api/csp-report` (크기 제한·URL 정리·204)
- `CSP_REPORT_URI` 환경변수(https 절대 URL 또는 같은 출처 경로)
- 헤더 구성 순수 모듈 분리 + 단위·e2e 테스트

## Out of Scope
- CSP 강제 전환(운영 위반 리포트 확인 후)
- 외부 수집처(Sentry 프론트 프로젝트) 생성
