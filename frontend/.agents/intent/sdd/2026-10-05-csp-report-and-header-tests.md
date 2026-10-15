# CSP 위반 수집·보안 헤더 테스트 SDD

## Meta
- sdd_id: 2026-10-05-csp-report-and-header-tests
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시)
- status: approved(design) — 기존 설정·BFF 경계 안의 소규모 변경
- issue: Dayro-dev/dayro#141
- linked_prd: `intent/prd/2026-10-05-csp-report-and-header-tests.md`

## Design Decisions
- 헤더 구성: `src/shared/config/security-headers.ts` `buildSecurityHeaders({ reportUri })` 순수 함수(경로 별칭·외부 의존성 없음) → `next.config.ts`가 import, 테스트가 같은 값 검증
- 수집 지시어: 강제·Report-Only CSP 모두 `report-uri <uri>; report-to csp-endpoint` + `Reporting-Endpoints: csp-endpoint="<uri>"`
- 수집처: 기본 `/api/csp-report/`(trailingSlash 로 리다이렉트 없이 수신), `CSP_REPORT_URI`가 https 절대 URL·같은 출처 경로면 그 값(빌드 시점 env). `;`·`,`·공백·따옴표·`//`·http 값은 버림(헤더 주입 방지)
- BFF `app/api/csp-report/route.ts`: POST, content-length·본문 16KB 초과 버림, `report-uri`(`{csp-report}`)·Reporting API(`[{type:"csp-violation", body}]`) 형식 파싱(최대 20건), URL 쿼리·fragment 제거 후 `console.warn("[CSP] 위반", …)`, 항상 204
- 파서: `shared/api/csp-report.ts`(server-only)

## Risks
- 공개 엔드포인트라 임의 POST 로 로그가 늘 수 있음 → 크기·건수 제한, Cloudflare 빈도 제한 대상에 포함
- 외부 수집처 전환 시 `CSP_REPORT_URI`는 빌드 시점 값이라 재배포 필요
