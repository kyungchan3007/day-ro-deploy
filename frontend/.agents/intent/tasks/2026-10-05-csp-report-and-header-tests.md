# CSP 위반 수집·보안 헤더 테스트

## Task Meta
- task_id: 2026-10-05-csp-report-and-header-tests
- date: 2026-10-05
- owner: Claude(구현)
- status: done
- task_type: 보안 보강
- linked_prd: `intent/prd/2026-10-05-csp-report-and-header-tests.md`
- linked_sdd: `intent/sdd/2026-10-05-csp-report-and-header-tests.md`
- branch: `bug/#141-csp-report-and-header-tests`

## Acceptance Criteria
- must: 모든 응답 CSP(강제·Report-Only)에 `report-uri`·`report-to`, `Reporting-Endpoints` 헤더
- must: `/api/csp-report`가 두 리포트 형식을 받아 URL 정리 후 로그, 16KB 초과 버림, 항상 204
- must: `CSP_REPORT_URI` https 값만 반영, 위험 값은 기본 경로로 대체
- must: 보안 헤더 설정(단위)·실제 응답(e2e) 테스트

## Evidence Result
- unit: 보안 헤더 6건(강제 CSP·Report-Only 허용 목록·nosniff 등·수집 지시어·CSP_REPORT_URI 위험 값 거부·next.config 적용), CSP 리포트 파서·라우트 6건
- e2e: 보안 헤더(`/`·`/login/`·`/api/regions/`) + `/api/csp-report/` 204 — 20/20
- 별도 커밋: 반복되던 `contact-form.test.tsx` 타임아웃 해소(테스트 안 동적 import → 정적 import) → 전체 764/764 3회 연속 통과
- lint 0 errors · tsc · build · 번들 예산(`/` 574,209B · `/course/new` 619,347B)
