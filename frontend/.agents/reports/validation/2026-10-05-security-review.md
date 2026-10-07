# 프론트엔드 보안 점검 (코드 기준)

## Meta
- date: 2026-10-05
- 기준: develop `37f7d2d` (PR#137 머지 직후)
- 범위: `frontend/` 앱 코드(BFF Route Handler·proxy·인증 쿠키·클라이언트 렌더링·분석 스크립트·의존성·설정). 배포(Cloudflare) 환경 설정은 범위 밖, 배포 시 확인 항목으로만 기록
- 방식: 정적 코드 검토 + 백엔드 코드 대조 + `npm audit` + git 이력 비밀값 패턴 스캔. 수정은 하지 않음(점검만)
- 점검자: Claude

## 요약
| 등급 | 건수 | 항목 |
| --- | --- | --- |
| P1 | 2 | S1 refresh BFF 가 토큰을 응답 본문에 노출 · S2 Next.js critical 취약점(16.2.9) |
| P2 | 4 | S3 저장 코스 id 경로 조작(백엔드 다른 API 호출 가능) · S4 `/login?message=` 임의 문구 노출 · S5 보안 응답 헤더 전무(CSP·클릭재킹) · S6 프록시 뒤 Secure 쿠키 판정 |
| P3 | 6 | S7~S12 |
| 이상 없음 | — | XSS 싱크, 비밀값 커밋, 오픈 리다이렉트(#131), 분석 PII, CSRF(SameSite=Lax) |

## P1

### S1. `/api/auth/refresh`가 access·refresh token 을 JSON 본문으로 돌려준다
- 위치: `src/app/api/auth/refresh/route.ts:41` `NextResponse.json(auth)`
- 근거: `refreshBackendAuth` 결과는 백엔드 `ApiResponse<AuthResponse>`(`accessToken`, `refreshToken`, `isNewUser`) 그대로. 쿠키는 httpOnly 로 설정하지만 같은 값이 본문에도 실린다.
- 시나리오: 같은 출처에서 실행되는 스크립트(XSS 1건, 또는 페이지에 로드되는 GA·Meta 등 서드파티 스크립트가 오염된 경우)가 `fetch("/api/auth/refresh", { method: "POST" })` 한 번으로 refresh token(14일)을 읽어 외부로 보낼 수 있다 → httpOnly 보호가 무력화되고 장기 세션 탈취.
- 현재 클라이언트 호출부는 없음(BFF_ENDPOINTS 에만 존재) → 기능 영향 없이 막을 수 있다.
- 권고: 본문을 `{ success: true, data: null }`(또는 `isNewUser`만)으로 바꾸거나, 쓰지 않는 엔드포인트면 제거. 같은 패턴이 다른 auth BFF 에 없는지 회귀 테스트 추가.

### S2. Next.js 16.2.9 critical/high 취약점
- `npm audit --omit=dev`: critical 1(next), high 3(next 의존 postcss·sharp, nanoid), moderate 1. 전체(dev 포함) 23건.
- next 권고 중 직접 관련: "Middleware / Proxy bypass in App Router applications using Turbopack and single locale"(GHSA-6gpp-xcg3-4w24) — 이 앱은 Turbopack 빌드 + `proxy.ts` 사용. 단 i18n locale 설정이 없어 조건 해당 여부는 advisory 상세로 확인 필요. 보호 화면(`/mypage`, `/saved`)은 서버 컴포넌트에서도 세션을 다시 확인(`requireSavedAuth`, `app/mypage/page.tsx`)하므로 우회돼도 데이터 노출로 직결되지는 않음.
- 그 외: Server Actions DoS·SSRF(이 앱은 Server Actions 미사용 → 영향 낮음), postcss·sharp(빌드 시점/이미지 최적화 — `images.unoptimized: true`).
- 권고: `next` 16.3.8(마이너, semver 호환 안내)로 업그레이드 후 build·번들 예산·e2e 확인. `npm audit fix`(비파괴)로 nanoid·baseline-browser-mapping 정리.

## P2

### S3. 저장 코스 id 를 검증·인코딩 없이 백엔드 경로에 붙인다
- 위치: `src/shared/api/server-course-client.ts:114,147,181` `new URL(\`/api/courses/${courseId}\`, base)`; 호출부 `app/api/courses/[id]/route.ts`, `getCourseDetailForServerComponent`.
- 근거: `new URL("/api/courses/../auth/withdraw", base).pathname` → `/api/auth/withdraw`(node 로 확인). 동적 세그먼트 값은 디코딩되어 들어오므로 `..%2Fauth%2Fwithdraw` 형태로 `../`가 전달될 수 있다.
- 시나리오: `DELETE /api/courses/..%2Fauth%2Fwithdraw/` → BFF 가 사용자 Bearer 토큰을 붙여 백엔드 `DELETE /api/auth/withdraw` 호출 → 회원 탈퇴. 교차 출처에서는 DELETE 가 CORS preflight 에 막히므로 단독 악용은 어렵지만, S1 과 같은 같은-출처 스크립트가 있으면 계정 삭제까지 이어진다. GET 경로는 `/api/auth/me` 등 조회로 바뀐다.
- 대조: situations retry 는 `encodeURIComponent(requestId)` 사용(안전).
- 권고: id 를 양의 정수 등 백엔드 계약 형식으로 검증(실패 시 400), 경로에는 `encodeURIComponent` 적용. 단위 테스트에 `../` 케이스 추가.

### S4. 로그인 화면이 `message` 쿼리를 그대로 보여준다(content spoofing)
- 위치: `app/login/page.tsx` → `widgets/auth/LoginScreen.tsx:33` `const errorMessage = message || getLoginErrorMessage(error)`.
- 근거: React 가 이스케이프하므로 XSS 는 아님. 하지만 `https://<도메인>/login?message=계정이 정지되었습니다. 010-xxxx 로 연락주세요` 같은 링크로 공식 도메인에서 임의 문구를 보여줄 수 있다(피싱).
- 연관: 콜백(`app/api/auth/kakao/callback/route.ts:75-86`)이 백엔드 예외 메시지를 `message` 쿼리에 실어 보낸다 → 내부 오류 문구가 URL·히스토리·로그에 남음.
- 권고: `message` 쿼리 제거, `error` 코드 → 고정 문구 매핑만 사용(`getLoginErrorMessage`). 콜백은 코드만 전달.

### S5. 보안 응답 헤더가 없다
- 위치: `next.config.ts`(headers 미설정), `proxy.ts`(헤더 미설정).
- 없음: `Content-Security-Policy`(frame-ancestors 포함), `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- 시나리오: 클릭재킹(탈퇴·로그아웃 버튼을 투명 iframe 으로 덮기), XSS 발생 시 피해 확대(S1 토큰 유출 경로 차단 불가).
- 권고: 최소 `frame-ancestors 'none'`(또는 XFO DENY)·`nosniff`·`Referrer-Policy: strict-origin-when-cross-origin`부터. CSP 는 GA(`googletagmanager.com`, `google-analytics.com`)·Meta(`connect.facebook.net`, `facebook.com`)·Kakao 지도(`dapi.kakao.com`, `*.daumcdn.net`)·Kakao 인가 이동을 허용 목록으로, report-only 로 먼저 적용. HSTS 는 Cloudflare 에서 설정 가능.

### S6. Secure 쿠키 여부를 요청 프로토콜로만 판정
- 위치: `src/shared/api/server-auth-cookies.ts:13` `request.nextUrl.protocol === "https:"`.
- 시나리오: TLS 를 앞단(CDN·LB)에서 끝내고 앱이 http 로 요청을 받는 배포에서는 access·refresh token 쿠키가 Secure 없이 발급된다. Cloudflare Workers(OpenNext)에서는 보통 https 로 보이지만 배포 형태에 따라 달라짐.
- 권고: 운영(`NODE_ENV=production`)에서는 항상 Secure, 개발만 프로토콜 판정. 또는 공개 origin 환경변수 기준.

## P3
- S7 콜백 URL 을 요청 origin 으로 만든다(`buildKakaoCallbackUrl`, Host 헤더 기반). 카카오가 redirect_uri 허용 목록을 검증하므로 악용은 제한적이나, 프록시 뒤에서는 내부 host 가 들어가 로그인이 깨질 수 있음 → 공개 origin 환경변수 권장.
- S8 BFF 가 백엔드 오류 `message`를 그대로 클라이언트에 전달(situations·courses·auth). 백엔드가 내부 예외 문구를 내보내면 노출 → BFF 에서 코드→고정 문구 매핑 권장. 상태코드도 일괄 502(오류 구분 불가, 오늘 502 조사 때 확인).
- S9 서버 전용 모듈(`shared/api/server-*`)에 `import "server-only"` 가드 없음. 비 `NEXT_PUBLIC_` 값은 클라이언트에 인라인되지 않아 현재 누출은 없으나, 실수로 클라이언트에서 import 하면 빌드가 막히도록 가드 권장.
- S10 `BACKEND_API_BASE_URL` 미설정 시 `http://localhost:8080`으로 조용히 대체 → 운영에서는 미설정 시 즉시 실패하도록 권장.
- S11 `/ui-preview/**` 개발용 화면이 운영 빌드에 포함 → 운영 비노출(404) 권장.
- S12 BFF 에 요청 빈도 제한 없음. 코스 생성은 Gemini·Places 비용을 쓰므로(백엔드 일일 한도 있음) Cloudflare Rate Limiting 등으로 IP 단위 제한 권장.
- 운영 확인(코드 밖): `NEXT_PUBLIC_KAKAO_MAP_API_KEY`는 공개 키라 Kakao 콘솔에서 사이트 도메인 제한 필수. GA·Meta ID 는 공개값.

## 이상 없음으로 확인한 항목
- XSS 싱크: `dangerouslySetInnerHTML`·`innerHTML`·`eval`·`new Function` 0건. 지도 마커 HTML 은 숫자 순번만 삽입. 길찾기 URL 은 `encodeURIComponent` + `noopener,noreferrer`.
- 비밀값: 저장소에 `.env*` 추적 없음(`frontend/.gitignore`), frontend git 이력 패턴 스캔(Google API key·OpenAI key·사설키·GitHub 토큰·Kakao REST 키) 0건. 공개 env 는 GA·Meta·Kakao 지도 키·분석 on/off 뿐.
- 오픈 리다이렉트: `sanitizeLoginNextPath`(#131, 퍼징 30만 건 off-site 0).
- 인증 쿠키: access·refresh·OAuth state·next 모두 httpOnly·SameSite=Lax·Path=/ (Secure 는 S6). OAuth state 검증 있음.
- CSRF: 상태 변경 BFF 는 POST(JSON)·PUT·DELETE. SameSite=Lax 라 교차 사이트 요청에 인증 쿠키가 붙지 않고, PUT·DELETE·JSON POST 는 CORS preflight 에서 막힘. 추가 방어로 Origin 검사 고려 가능(필수 아님).
- 분석: 이벤트 파라미터 허용 목록 필터(`sanitizeParams`), UTM 정제, `/login`·민감 URL Meta 차단(#125·#129).
- 코스 생성 토큰 전달(#135): 만료·위조 토큰은 백엔드가 비회원 처리(401 없음), 토큰은 서버에서만 다룸.

## 실행한 명령
- `npm audit --omit=dev` / `npm audit` → prod 5건(critical 1·high 3·moderate 1), 전체 23건
- `git log --all -p -- frontend | grep -E <비밀값 패턴>` → 0건
- `node -e 'new URL("/api/courses/../auth/withdraw", base)'` → `/api/auth/withdraw`
- 백엔드 대조: `SecurityConfig`, `JwtAuthenticationFilter`, `JwtProvider.validateToken`, `AuthController`(`/refresh` → `AuthResponse`)

## 권장 처리 순서
1. S1(본문 토큰 제거) · S3(id 검증·인코딩) — 작은 변경, 영향 큼
2. S2(next 16.3.8 업그레이드 + audit fix)
3. S4(message 쿼리 제거) · S6(운영 Secure 고정)
4. S5(보안 헤더, CSP 는 report-only 로 시작) — Cloudflare 배포와 함께
5. P3 는 배포 체크리스트에 포함


## 조치 현황 (issue #139, branch `bug/#139-security-hardening`)
- 조치 완료: S1 · S2 · S3 · S4 · S5(강제 3지시어 + Report-Only 전체) · S6 · S7 · S10 · S11(proxy)
- Cloudflare 이관: S12 요청 빈도 제한 · HSTS · Kakao 지도 키 도메인 제한
- 조치 완료(추가): S8 BFF 오류 문구·상태코드 · S9 `server-only` 가드
- 후속: CSP 강제 전환(운영 Report-Only 위반 확인 후)
- 검증 리포트: `2026-10-05-security-hardening.md`
- 개발 의존성: 19건 → 5건(storybook 10.6.1·vitest 4.1.11·tailwind 4.3.3 등). 남은 5건은 eslint-config-next → braces 사슬(상위 패치 없음, lint 전용) → 수용
- CSP 위반 수집(`/api/csp-report`, `CSP_REPORT_URI`)·보안 헤더 단위/e2e 테스트: #141
