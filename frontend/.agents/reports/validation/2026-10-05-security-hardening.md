# Validation Report - 프론트엔드 보안 하드닝 (issue #139)

## Meta
- task_id: 2026-10-05-security-hardening
- date: 2026-10-05
- validator: 독립 보안 검증 세션(구현에 참여하지 않음)
- branch: `bug/#139-security-hardening` (미커밋 변경 기준, HEAD = origin/develop `123672a`)
- decision: **`approved_with_notes`** (P1 0 · P2 1 · P3 6) — P2 는 배포 형태에 따라 S6 이 다시 열리는 경우라 머지 전 또는 직후 후속 수정을 권장. 나머지는 머지를 막지 않음

## 작업 요약
`2026-10-05-security-review.md` 의 S1~S7·S10·S11 수정: refresh BFF 본문 토큰 제거, next 16.3.8, 저장 코스 id UUID 검증·인코딩, 로그인 `message` 쿼리 제거, 보안 헤더(강제 CSP 3지시어 + Report-Only 전체 CSP·XFO·nosniff·Referrer·Permissions), Secure 쿠키 판정 보강, `APP_ORIGIN` 기반 redirect_uri, `BACKEND_API_BASE_URL` fail-fast, 운영 `/ui-preview` 404.

## Intent / AC 출처
- `.agents/intent/{prd,sdd,tasks}/2026-10-05-security-hardening.md`
- `.agents/reports/validation/2026-10-05-security-review.md`(원 점검), `.agents/guides/bff.md`

## 변경 파일 요약
| 파일 | 변경 |
|---|---|
| `src/app/api/auth/refresh/route.ts` | 본문 `{ success, message, data: null }` |
| `package.json`, `package-lock.json` | next·eslint-config-next 16.2.9 → 16.3.8 (sharp 0.35.5, postcss 8.5.23, nanoid 3.3.20 등 추이 갱신) |
| `src/shared/api/server-course-client.ts` | `buildCourseDetailPath`(UUID 정규식 + `encodeURIComponent`), GET/PUT/DELETE 3곳 적용 |
| `src/features/auth/model/oauth.ts`, `app/api/auth/kakao/callback/route.ts`, `app/login/page.tsx`, `widgets/auth/LoginScreen.tsx` | `message` 경로 전부 제거, 콜백 catch 는 코드만 |
| `next.config.ts` | `headers()` 보안 헤더, `poweredByHeader: false` |
| `src/shared/api/server-auth-cookies.ts` | `isSecureRequest`(https · XFP · 운영(루프백 제외)), `buildKakaoCallbackUrl` 의 `APP_ORIGIN` |
| `src/shared/api/backend-base-url.ts`(신규) + auth/course/situation 클라이언트 | 공용 `getBackendBaseUrl`, 운영 런타임 미설정 시 throw |
| `src/proxy.ts` | `/ui-preview` 운영 404, matcher 추가 |
| 테스트 | `cookie-security.test.ts`·`backend-base-url.test.ts`(신규), `server-auth`·`login`·`login-next`·`server-saved-course-detail` 수정 |
| `.agents/guides/bff.md` | 서버 환경변수·보안 기준 섹션 |

## 항목별 검증 (우회 시도 포함)
| 항목 | 결과 | 근거 / 시도 |
|---|---|---|
| S1 refresh 본문 토큰 | 해결 | `refresh/route.ts:43-47`. 다른 auth BFF 대조: `me`(세션 `{authenticated,user}`만, `server-auth-session.ts:39-45`), `withdraw`(`apiVoidResponseSchema`), `logout`(고정 본문), `kakao/start`(authorize URL 에 state·client_id·redirect_uri 만 — 토큰 아님), `kakao/callback`(redirect, 토큰은 쿠키만). URL·본문에 토큰/비밀값 없음. 테스트 `server-auth.test.ts:126-129`가 본문 전체 일치 + 토큰 문자열 부재를 단언 |
| S2 next 업그레이드 | 해결 | `npm audit --omit=dev` → **0 vulnerabilities**. HEAD↔현재 lock 버전 비교: 변경은 next·@next/*·eslint-config-next 16.3.8, sharp/@img 0.35.5, postcss(next 하위) 8.5.23, nanoid 3.3.20, @swc/helpers, baseline-browser-mapping, fastq 뿐(의도 범위). `npm ls next` 전부 16.3.8 dedupe. 전체 audit 23 → 19(모두 dev 의존). `node_modules` 에 extraneous wasm 패키지 몇 개는 로컬 설치 잔여물로 lock 과 무관 |
| S3 코스 id 경로 조작 | 해결 | 정규식 `/^…$/i`(`server-course-client.ts:39-50`) node 퍼징: 대문자 통과(백엔드 `UUID.fromString` 허용 → 정상), `uuid\n`·`\r\n`·선행 개행 거부(JS `$` 는 m 플래그 없이 개행 앞에서 매치 안 함), 전각/아랍 숫자·ZWSP·U+2028·NUL·`%2F..`·`../uuid`·`uuid/` 거부, 1MB 입력 거부 및 ReDoS 없음(10만 자 ×100회 1ms). 백엔드 `CourseController.java:43-58` 모두 `@PathVariable UUID id` → 계약 일치. e2e mock id 도 UUID(`saved.spec.ts:4`). 테스트는 `../auth/withdraw`·`%2e%2e/…`·`1`·`not-a-uuid` 에서 400 + 백엔드 호출이 `/api/auth/me` 1회뿐임을 단언(DELETE 경로만, GET/PUT 은 같은 함수라 간접 커버) |
| S4 `message` 쿼리 | 해결 | `grep message` — page·LoginScreen·oauth·callback 에서 전부 제거. 쿼리 원문을 렌더하는 다른 곳 없음(`searchParams` 사용처는 `/login`, `/course/new`(파서 통과 후 enum 값만)). 단 남은 `error` 코드 매핑에 프로토타입 키 문제 → P3-1 |
| S5 보안 헤더 | 해결(Report-Only 목록은 보강 필요) | 강제 CSP `frame-ancestors 'none'; base-uri 'self'; object-src 'none'` 구문 유효, 앱이 `<base>`·`<object>`·자기 iframe 삽입을 쓰지 않아 깨질 것 없음. XFO DENY + frame-ancestors: Storybook/Chromatic 은 별도 서버(Vite)라 next 헤더 미적용, Kakao OAuth 는 top-level 이동, Kakao 지도는 DOM 렌더(iframe 아님) → 영향 없음. Permissions-Policy 의 geolocation 등: 코드에서 사용처 0건. Report-Only: GA4(`www.googletagmanager.com`, `*.google-analytics.com`, `*.analytics.google.com`)·Meta(`connect.facebook.net`, `www.facebook.com`)·Kakao(`dapi.kakao.com`, `*.daumcdn.net`, 타일은 `img-src https:`) 포함. 누락 → P3-2 |
| S6 Secure 판정 | 부분 해결 | XFP 스푸핑은 Secure 를 **더하는** 방향뿐 — 공격자 자신의 응답에만 영향(http 에서 쿠키 저장 실패), 타 사용자 무해. 반면 루프백 예외가 Host 헤더 기반이라 프록시 구성에 따라 S6 재발 → **P2-1** |
| S7 `APP_ORIGIN` | 해결 | `server-auth-cookies.ts:57`. 테스트가 내부 IP 요청에서도 `APP_ORIGIN` 기반 redirect_uri 를 단언. 백엔드 토큰 교환은 자체 `KAKAO_REDIRECT_URI`(`application-prod.yml:48`) 사용 → 두 값이 같아야 함(배포 체크). 스킴 없는 오설정 시 `new URL` TypeError → P3-5 |
| S10 fail-fast | 해결(조용한 실패 경로 있음) | `NEXT_PHASE` 는 `next/dist/build/index.js:1220`에서 static worker 생성 **전에** `phase-production-build` 로 설정 → 워커 상속, 빌드 중 예외 미발생 확인. 빌드 시 백엔드를 호출하는 정적 페이지 없음(백엔드 사용 라우트는 모두 ƒ). 런타임 미설정 시 세션 해석은 catch 로 삼켜 쿠키를 지움 → P3-4 |
| S11 `/ui-preview` | 해결 | 빌드 산출 matcher 정규식 대조: `/ui-preview`, `/ui-preview/`, `/ui-preview/colors/`, `.rsc`, `.segments/…segment.rsc`, `index.txt` 모두 매치 → proxy 404. `/UI-PREVIEW/`·`//ui-preview/`·`/ui-preview%2Fcolors` 는 matcher 불일치지만 App Router 가 대소문자 구분·라우트 없음으로 404 예상. `/%75i-preview/`(퍼센트 인코딩된 비예약 문자)는 matcher 불일치 + 라우터 디코딩 여부 미검증 → P3-6 |

## Findings

### P2-1. 루프백 예외가 Host 헤더 기반이라 리버스 프록시 뒤에서 S6 이 다시 열린다
- 위치: `src/shared/api/server-auth-cookies.ts:12,30-33`
- 시나리오: Node 로 self-host 하고 nginx 가 `proxy_pass http://localhost:3000;`(기본값: `Host: localhost:3000`, `X-Forwarded-Proto` 미전달)로 넘기는 흔한 구성. 앱이 보는 요청은 `http://localhost:3000/...` → https 아님, XFP 없음, hostname 이 루프백 → `secure: false`. 운영 HTTPS 사이트에서 access·refresh·OAuth state 쿠키가 Secure 없이 발급되어, 같은 도메인 http 요청(HSTS 미적용 첫 접속·다운그레이드)에 실려 나갈 수 있음 = 원래 S6 시나리오 그대로. Cloudflare Workers(OpenNext)는 공개 https URL 이 보여 해당 없음 → 배포 형태 의존이라 P2.
- 반대 방향(공격자가 `Host: localhost`로 운영에 요청): 자기 응답 쿠키만 non-Secure 가 됨, 인증 응답은 캐시 대상 아님 → 타 사용자 영향 없음.
- 권고: 예외를 요청 값이 아닌 **서버 설정**으로 판단. 예) `APP_ORIGIN` 이 있으면 `new URL(APP_ORIGIN).protocol === "https:"` 로 결정, 루프백 예외는 e2e start 스크립트(`src/e2e/support/dev-with-mock-backend.mjs`)가 넣는 명시적 env(예: `AUTH_COOKIE_ALLOW_INSECURE=1`)일 때만. 테스트에 "운영 + Host: localhost + APP_ORIGIN=https → Secure" 케이스 추가.

### P3-1. `error`/`notice` 매핑이 `in` 연산자라 프로토타입 키가 통과한다 (S4 의 남은 유일 경로)
- 위치: `src/features/auth/model/oauth.ts:111,123`
- 재현(node): `"__proto__" in {…}` → true → `Object.prototype` 반환, `toString`/`constructor`/`valueOf` → 함수 반환.
- 시나리오: `/login?error=__proto__` → `LoginScreen` 이 객체를 React child 로 렌더 → "Objects are not valid as a React child" 로 로그인 페이지 서버 렌더 실패(오류 화면). `?error=toString` 은 빈 오류 박스. 문구 위조는 아님(가용성/표시 이슈), 기존 코드지만 이번 수정으로 이 함수가 유일한 문구 경로가 됨.
- 권고: `Object.hasOwn(LOGIN_ERROR_MESSAGES, error)`(notice 동일) + 테스트 `__proto__`·`toString` 케이스.

### P3-2. Report-Only CSP 보강 필요(강제 전환 전 필수)
- 위치: `next.config.ts:22-28`
- `form-action 'self' https://kauth.kakao.com`: 브라우저는 폼 제출 후 리다이렉트 체인에도 form-action 을 적용한다. 카카오 미로그인 사용자는 `kauth.kakao.com/oauth/authorize` → `accounts.kakao.com/login…` 으로 다시 리다이렉트되므로, 강제 전환 시 그 사용자들의 로그인이 막힐 가능성이 높다(추정 — Report-Only 위반 로그로 확인). `https://accounts.kakao.com` 추가 권장(카카오톡 앱 로그인 경로도 확인).
- GA4: Google 권장 목록은 `*.googletagmanager.com`(script·img·connect). Google Signals/광고 기능을 켜면 `https://*.g.doubleclick.net`, `https://www.google.com`(connect·img) 위반 발생.
- `report-uri`/`report-to` 없음 → "위반 로그 확인"은 개발자 콘솔 수동 확인뿐. 수집 엔드포인트를 두거나 스모크 절차를 명시.
- dev 모드에서는 React/Turbopack 의 `eval` 때문에 Report-Only 경고가 콘솔에 쌓인다(차단 아님, 정보성).

### P3-3. situations retry 의 `requestId` 는 `.`/`..` 가 인코딩되지 않는다
- 위치: `src/shared/api/server-situation-backend-client.ts:167`
- `encodeURIComponent("..")` = `..` → `new URL("/api/situations/../retry")` = `/api/retry`, `.` → `/api/situations/retry`. 백엔드에 해당 POST 매핑이 없어(전체 매핑 확인: `SituationController` `/{requestId}/retry`, 루트 POST 만) 현재 실제 영향 없음. 원 점검의 "situations 는 안전" 판단은 이 경계 케이스를 빠뜨림.
- 권고: `requestId` 를 백엔드가 발급하는 형식으로 검증(형식 확정 시 정규식, 최소한 `.`/`..` 거부), 코스 id 와 같은 헬퍼 패턴.

### P3-4. `BACKEND_API_BASE_URL` 누락이 세션 해석에서는 "조용한 로그아웃"으로 바뀐다
- 위치: `src/shared/api/backend-base-url.ts:19`, 호출부 `src/shared/api/server-auth-session.ts:47-77`
- 운영에서 env 누락 시 `fetchBackendCurrentUser`·`refreshBackendAuth` 의 throw 를 catch 가 삼켜 `clearAuthTokenCookies` → 모든 사용자 로그아웃 + 에러 로그 없음. 코스·상황 BFF 는 502 로 드러나지만 인증은 드러나지 않는다.
- 권고: 설정 오류를 별도 에러 타입으로 던지고 세션 해석 catch 에서 재throw 하거나 최소 `console.error`. (런타임 설정 누락 상황 한정이라 P3)

### P3-5. `APP_ORIGIN` 값 검증 없음
- 위치: `src/shared/api/server-auth-cookies.ts:57`
- `APP_ORIGIN=dayro.kr`(스킴 누락) 같은 오설정 시 `new URL(…)` TypeError → `/api/auth/kakao/start` 500. 또 `APP_ORIGIN` 기반 redirect_uri 와 백엔드 `KAKAO_REDIRECT_URI` 가 다르면 토큰 교환 실패.
- 권고: `new URL(APP_ORIGIN).origin` 으로 정규화하고 실패 시 명확한 에러, 배포 체크리스트에 두 값 일치 항목 추가. 로그인 성공·실패 후 redirect(`callback/route.ts:32,64`)는 여전히 `request.url` 기준이라 프록시 뒤에서는 같은 origin 문제가 남는다(원 S7 범위 밖 잔여).

### P3-6. `/ui-preview` 차단의 미검증 경계
- 위치: `src/proxy.ts:35`, matcher `src/proxy.ts:67`
- 빌드 matcher 정규식은 `/%75i-preview/`(=`/ui-preview/` 의 퍼센트 인코딩)와 불일치. 라우터가 이를 디코딩해 정적 페이지를 서빙하면 proxy 를 건너뛴다. 서버 기동이 금지라 실제 응답은 미확인. 또한 `/ui-preview` 는 ○ Static 이라, 배포 플랫폼이 프리렌더 HTML 을 정적 자산으로 직접 서빙하면 proxy 가 실행되지 않는다(OpenNext Cloudflare 설정 확인 필요).
- 영향: 노출돼도 개발용 UI 데모뿐(데이터·인증 없음) → P3.
- 권고: 운영 스모크에서 `/ui-preview/`, `/%75i-preview/` 응답 확인. 근본적으로는 운영 빌드에서 라우트 자체를 제외(예: page 에서 `process.env.NODE_ENV === "production"` 이면 `notFound()`)하는 편이 플랫폼 독립적.

## 테스트가 보안 속성을 실제로 단언하는가
| 테스트 | 판정 | 비고 |
|---|---|---|
| `server-auth.test.ts` refresh | 충분 | 본문 정확 일치 + 토큰 문자열 부재 |
| `server-saved-course-detail.test.ts` S3 | 충분(일부) | 400 + 백엔드 호출이 `/me` 1회뿐. 대문자 UUID 통과·인코딩 경로 단언, GET/PUT 케이스는 없음 |
| `login.test.ts`·`login-next.test.ts` S4 | 충분 | 타입 밖 `message` 주입도 URL 미포함, 콜백 예외 메시지가 URL 에 없음 |
| `cookie-security.test.ts` S6·S7·S11 | 보통 | 운영 Secure·XFP·루프백·APP_ORIGIN·ui-preview 404 단언. 부족: 개발 + XFP 없음 → non-Secure(음성 대조), XFP `"https, http"` 다중 값, access/refresh 쿠키 직접 단언(현재 state 쿠키로 간접 — 같은 `getCookieBaseOptions` 라 동치), P2-1 케이스 |
| `backend-base-url.test.ts` S10 | 충분 | 운영 throw / 빌드 단계 예외 / 개발 대체 |
| 보안 헤더 | 없음 | `next.config.ts` headers 값에 대한 단위 테스트 없음(설정 회귀 방지용으로 `nextConfig.headers()` 스냅샷 단언 권장) |

## Evidence (검증자가 직접 실행, `frontend/`)
| 명령 | 결과 |
|---|---|
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run lint` | 0 errors, 2 warnings(기존: `public/mockServiceWorker.js`, `useWheelColumn.ts` 미사용 import — 이번 변경 무관) |
| `npx vitest run src/features/auth src/shared/api src/features/saved src/proxy` | 23 files / 442 tests pass |
| `npx vitest run` (전체) | 719 pass / 2 fail — 알려진 flake `src/features/faq/test/contact-form.test.tsx`(5s timeout). 단독 재실행 18/18 pass |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm audit` | 19 (moderate 9 · high 10, dev 의존) — 점검 시 23 |
| `npm ls next eslint-config-next` + HEAD↔현재 lock 버전 diff 스크립트 | 전부 16.3.8, 변경 패키지 의도 범위 내 |
| `npm run build` | 성공(Next 16.3.8 Turbopack), 26 페이지. `.env.local` 에 `BACKEND_API_BASE_URL` 키가 있어 env 미설정 빌드는 실측하지 못함 → `NEXT_PHASE` 설정 위치를 Next 소스(`dist/build/index.js:1220`)로 확인 |
| `node scripts/check-route-bundle-budget.mjs` | exit 0 |
| node 퍼징: UUID 정규식, `new URL` dot-segment, 빌드 matcher 정규식, `in` 프로토타입 키 | 위 표·Findings 에 결과 기재 |
| e2e / dev·start 서버 | **미실행**(지시상 금지). 헤더 실제 응답·`/ui-preview` 실제 404·CSP 위반 로그는 미확인 |

## 배포 전 확인(코드 밖)
- 운영 env: `BACKEND_API_BASE_URL`, `KAKAO_REST_API_KEY`, `APP_ORIGIN`(백엔드 `KAKAO_REDIRECT_URI` 와 같은 origin+경로)
- 배포 후 응답 헤더 6종·`x-powered-by` 부재, `/ui-preview/` 404, 로그인(카카오 미로그인 상태 포함) 시 콘솔 Report-Only 위반 목록 수집 → P3-2 반영 후 강제 전환
- HSTS 는 Cloudflare 에서 설정


## Addendum — 구현자 반영 (2026-10-05)
- P2-1: `isSecureRequest` 루프백(Host) 예외 제거 → `AUTH_COOKIE_ALLOW_INSECURE=1` 명시 opt-in 으로만 http 쿠키 허용. e2e 서버(`dev-with-mock-backend.mjs`)에 opt-in. 테스트: 운영 + Host localhost → Secure, opt-in → non-Secure, 개발 + http·XFP `http, https` → non-Secure(대조군).
- P3-1: `Object.hasOwn` 적용 + `__proto__`·`constructor`·`toString`·`hasOwnProperty` 테스트.
- P3-2: Report-Only form-action `accounts.kakao.com`, GA `*.googletagmanager.com` 추가. report-uri 는 수집 경로 결정 후.
- P3-3: retry requestId `^[A-Za-z0-9_-]{1,64}$` 검증 + 테스트(`..`·`../auth/withdraw`·`a/b`·점 포함·빈 값 → 백엔드 미호출).
- P3-5: `APP_ORIGIN` 형식 검증(잘못되면 요청 origin) + 테스트.
- P3-4·P3-6: 후속(intent SDD Risks 기록).
- 재검증: lint 0 errors · tsc · unit 728 pass(기존 flaky 2) · build · 번들 예산 · e2e 18/18.
