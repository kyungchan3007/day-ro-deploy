# 배포 전 보안 조치

## Task Meta
- task_id: 2026-10-05-security-hardening
- date: 2026-10-05
- owner: Claude(구현) / 독립 검증 세션(검증)
- status: approved(approve-with-notes) — 독립 검증 세션
- task_type: 보안 수정
- linked_prd: `intent/prd/2026-10-05-security-hardening.md`
- linked_sdd: `intent/sdd/2026-10-05-security-hardening.md`
- branch: `bug/#139-security-hardening`

## Acceptance Criteria
- must: refresh BFF 응답 본문에 토큰이 없다(쿠키는 유지).
- must: 운영 의존성 `npm audit --omit=dev` 0건, Next 16.3.8.
- must: UUID 가 아닌 저장 코스 id 는 백엔드를 호출하지 않고 400.
- must: 로그인 실패 리다이렉트·화면에 자유 문구가 실리지 않는다.
- must: 모든 응답에 frame-ancestors 'none'·XFO DENY·nosniff·Referrer-Policy·Permissions-Policy, x-powered-by 없음.
- must: 운영에서는 인증 쿠키가 항상 Secure(예외는 `AUTH_COOKIE_ALLOW_INSECURE=1` 명시 시만), `APP_ORIGIN` 설정 시 redirect_uri 가 그 origin.
- must: 운영 런타임 `BACKEND_API_BASE_URL` 미설정 시 즉시 실패, 운영 `/ui-preview` 404.
- must not: 로그인·코스 흐름 회귀, 번들 예산 baseline 상향.

## Evidence Result
- unit: refresh 본문 토큰 없음, 콜백 실패 코드만, 비UUID id 4종 400·백엔드 미호출, Secure·APP_ORIGIN 5건, backend-base-url 4건, ui-preview 404 — 전체 unit 719 통과(기존 flaky contact-form 2)
- lint 0 errors · tsc · build(Next 16.3.8)
- 번들 예산 통과: `/` 574,197B · `/course/new` 619,335B · `/saved` 643,192B (16.2.9 대비 약 −57KB)
- e2e 18/18(start 모드, 로그인 복귀·저장·코스 흐름 포함)
- 운영 빌드 응답 헤더 확인(curl): CSP·CSP-Report-Only·XFO·nosniff·Referrer-Policy·Permissions-Policy, x-powered-by 없음, `/ui-preview/` 404
- `npm audit --omit=dev` 0건(전체 19건은 개발 의존성)

## 독립 검증 반영 (approve-with-notes, P1 0 · P2 1 · P3 6)
- P2 Secure 루프백 예외를 Host 대신 서버 설정(`AUTH_COOKIE_ALLOW_INSECURE`)으로 → 반영, e2e 서버에 opt-in
- P3 반영: `Object.hasOwn`(`__proto__`), retry requestId 형식 검증, `APP_ORIGIN` 형식 검증, CSP Report-Only 보강
- P3 후속: 세션 해석 시 설정 누락 예외 로그, `/ui-preview` 정적 서빙 우회, CSP report 수집, 보안 헤더 단언 테스트
- 재검증: lint 0 errors · tsc · unit 728 통과(기존 flaky 2) · build · 번들 예산(`/` 574,209B, `/course/new` 619,347B) · e2e 18/18
- 리포트: `.agents/reports/validation/2026-10-05-security-hardening.md`

## S8·S9 추가 (사용자 지시)
- must: 백엔드 4xx·503 은 상태·문구 그대로, 그 밖 5xx·네트워크·비JSON·계약 불일치는 502 + 고정 문구, 원래 예외 문구 미노출.
- must: 백엔드 응답 계약 불일치를 입력 오류 400 으로 내보내지 않는다.
- must: 백엔드 장애로 인증 쿠키를 지우지 않는다(토큰 거절일 때만).
- must: 서버 전용 모듈을 클라이언트에서 import 하면 빌드 실패.
- 결과: backend-error 21건 신규(상태 매핑 10·문구 규칙·비JSON·누출 방지·세션 장애/거절), proxy 장애 유지 테스트, bff-error-mapping 502 로 갱신 · unit 750 통과(기존 flaky 2) · lint 0 errors · tsc · build · 번들 예산(`/` 574,209B · `/course/new` 619,347B · `/saved` 643,204B) · e2e 18/18 · audit(prod) 0 · 클라이언트 import 시 `server-only` 빌드 실패 확인

## 개발 의존성 취약점 정리 (사용자 지시)
- 전체 `npm audit` 19건 → 5건(운영 0건 유지)
- storybook 묶음 10.5.3 → 10.6.1(addon-mcp 0.7.0 → 10.6.1, addon-a11y·docs·vitest·nextjs-vite·eslint-plugin-storybook)
- vitest·@vitest/browser-playwright·@vitest/coverage-v8 4.1.10 → 4.1.11(@vitest/mocker 경로 조작 해소)
- tailwind(@tailwindcss/postcss) 4.3.1 → 4.3.3, browserslist·image-size·js-yaml·brace-expansion·postcss·valibot 범위 내 갱신
- npm `audit fix`·단건 install 이 lock 트리(`edgesOut` 오류·peer 고정)로 실패 → storybook·vitest 관련 lock 항목 30개만 제거 후 재설치(운영 의존성 고정 유지)
- Storybook 10.6 이 `trailingSlash: true`를 반영 → Link href 기대값 3건 `/…/`로 갱신(실제 앱과 동일)
- 남은 5건: `eslint-config-next → @next/eslint-plugin-next → fast-glob@3.3.1 → micromatch → braces@3.0.3` 한 사슬
  - braces 최신 3.0.3 까지 취약(GHSA-vfj7-8cjw-p6xm), 패치 릴리스 없음
  - Next eslint 플러그인 16.3.8·16.4.0-canary.60 모두 같은 의존성
  - 공격 조건: 공격자 입력 glob 패턴 → 여기선 lint 설정 고정 패턴만, 운영 미포함 → 수용, 상위 패치 시 갱신
- 재검증: unit+storybook 750 통과(기존 flaky 2) · lint 0 errors · tsc · build · 번들 예산 · e2e 18/18 · storybook build 성공
