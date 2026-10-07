# 배포 전 보안 조치 SDD

## Meta
- sdd_id: 2026-10-05-security-hardening
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시) / 독립 검증 세션(검증)
- status: approved(design) — 기존 BFF·설정 경계 안의 보안 수정
- issue: Dayro-dev/dayro#139
- linked_prd: `intent/prd/2026-10-05-security-hardening.md`

## Design Decisions
- S1 `app/api/auth/refresh/route.ts`: 쿠키는 그대로 설정, 본문은 `{ success, message, data: null }`. 클라이언트 호출부 없음(영향 없음).
- S2 `next`·`eslint-config-next` 16.2.9 → 16.3.8(정확한 버전 고정), `npm update nanoid baseline-browser-mapping` → `npm audit --omit=dev` 0건. 번들은 전 라우트 약 −57KB(예산 여유 증가, baseline 은 그대로 둠).
- S3 `shared/api/server-course-client.ts` `buildCourseDetailPath`: 백엔드 `@PathVariable UUID` 계약에 맞춰 UUID 정규식 검증 → 실패 시 `BackendCourseRequestError(400)`, 통과 시 `encodeURIComponent`. 상세·수정·삭제 3곳 공용. Route Handler 는 기존 4xx 매핑으로 400 반환.
- S4 `buildLoginErrorSearchParams`에서 `message` 제거, 콜백 catch 는 `oauth_backend_failed` 코드만, `LoginScreen`·login page 의 `message` prop 제거.
- S5 `next.config.ts` `headers()`: 강제 CSP(`frame-ancestors 'none'; base-uri 'self'; object-src 'none'`) + 전체 허용 목록 Report-Only(GA·Meta·Kakao 지도·kauth form-action, Next 인라인 스크립트 때문에 `'unsafe-inline'`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `poweredByHeader: false`. HSTS 는 Cloudflare(서브도메인 영향 판단 필요).
- S6 `isSecureRequest`: https 또는 `x-forwarded-proto: https` 또는 운영이면 Secure. 예외는 요청 값(Host)이 아니라 서버 설정 `AUTH_COOKIE_ALLOW_INSECURE=1`로만(로컬 운영 빌드·e2e start 모드). 독립 검증 P2 반영: Host 기반 루프백 예외는 `proxy_pass http://localhost` 구성에서 Secure 누락을 다시 만들기 때문.
- S7 `buildKakaoCallbackUrl`: `APP_ORIGIN`이 http(s) 절대 URL 이면 그 origin, 형식이 틀리거나 없으면 요청 origin(로그인 시작 500 방지).
- S10 `shared/api/backend-base-url.ts`로 3개 transport 의 중복 helper 통합, 운영 런타임(빌드 단계 제외)에서 미설정 시 throw.
- S11 `proxy.ts` matcher 에 `/ui-preview/:path*` 추가, 운영이면 404(빌드·번들 영향 없음).

### S8 BFF 오류 문구·상태코드 (사용자 지시로 같은 PR 에 포함)
- 백엔드는 `ApiResponse{success,message,data}`만 내려주고 오류 코드 필드는 없다 → 상태코드 + ErrorCode 문구 기준으로 정리.
- `shared/api/backend-error.ts`: `BackendApiError`·`readBackendJson`(비JSON → null)·`toBackendApiError`(4xx·503 백엔드 문구, 그 밖 5xx fallback)·`toBffErrorStatus`(4xx·503 전달, 그 밖 502)·`bffErrorResponse`·`isBackendAuthRejection`.
- 3개 transport 의 중복 `getBackendErrorMessage`·`parseJsonResponse` 제거, `BackendCourseRequestError`는 `BackendApiError` 상속(이름 유지).
- 라우트: situations·retry·regions·popular-keywords·withdraw(일괄 500 → 규칙), 코스 BFF 는 `toBffErrorStatus`.
- 기존 버그 수정: situations·코스 저장·수정이 백엔드 응답 ZodError 를 입력 오류 400 으로 내보냄 → 입력 검증을 try 밖으로 분리(`bff-error-mapping.test`의 "known follow-up" 해소).
- 세션: me·refresh·proxy 가 장애에도 쿠키를 지우던 문제 → 토큰 거절일 때만 정리(P3-4 조용한 로그아웃 해소).

### S9 서버 전용 가드
- `server-only@0.0.1` 추가, 서버 파일 첫 줄 가드, vitest alias. 클라이언트에서 import 시 빌드 실패를 실험으로 확인.

### 독립 검증 P3 반영
- `getLoginErrorMessage`·`getLoginNoticeMessage`: `in` → `Object.hasOwn`(`?error=__proto__`로 객체가 렌더돼 로그인 화면이 깨지던 문제).
- retry requestId: `^[A-Za-z0-9_-]{1,64}$` 검증(`..`은 인코딩해도 그대로라 `/api/retry`로 정규화 가능). 백엔드 UUID·목 `request-N` 모두 허용.
- Report-Only CSP: form-action 에 `accounts.kakao.com`, GA `*.googletagmanager.com`.

## Risks
- CSP Report-Only 는 차단하지 않으므로 운영 스모크에서 콘솔 위반 로그 확인 후 강제 전환 필요.
- form-action 을 강제로 두면 카카오 리다이렉트를 막을 수 있어 Report-Only 에만 둠.
- 후속: 운영에서 `BACKEND_API_BASE_URL` 누락 시 세션 해석 catch 가 예외를 삼켜 조용히 로그아웃(S10 로그 보강), `/ui-preview`는 정적 HTML 직접 서빙 시 proxy 우회 가능(데모 화면뿐) → page `notFound()` 검토, CSP `report-uri` 수집 경로.
