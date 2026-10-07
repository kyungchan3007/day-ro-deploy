# Validation Report - 로그인 후 원래 화면(next) 복귀 (issue #131)

## Meta
- task_id: 2026-10-05-login-next-redirect
- date: 2026-10-05
- validator: 독립 ValidationAgent 세션(구현에 참여하지 않음)
- branch: `bug/#131-login-next-redirect` (미커밋 변경 기준)
- decision: **`rejected`** (P1 1건 — 한 줄 수정 + 테스트 추가 후 재검증하면 `approved_with_notes` 예상)

## 작업 요약
`/login?next=` 값을 page → 로그인 폼 hidden input → `/api/auth/kakao/start`(httpOnly 쿠키 `dayro_oauth_next`) → callback 으로 전달해, 로그인 성공 시 원래 화면으로 돌아가게 하는 버그 수정. 실패·취소 시 `/login?error=...&next=`로 유지.

## Intent / AC 출처
- `.agents/intent/tasks/2026-10-05-login-next-redirect.md` (AC)
- `.agents/intent/sdd/2026-10-05-login-next-redirect.md`
- 기준 문서: `AGENTS.MD`, `.agents/agents/validation.md`, `.agents/guides/bff.md`, `.agents/guides/server-client-boundary.md`, `.agents/guides/accessibility.md`, `.agents/domain/login.md`

## 변경 파일 요약
| 파일 | 변경 |
|---|---|
| `src/features/auth/model/oauth.ts` | `OAUTH_NEXT_COOKIE_NAME`, `sanitizeLoginNextPath`, `buildLoginErrorSearchParams`에 `next` |
| `src/shared/api/server-auth-cookies.ts`, `server-auth.ts` | next 쿠키 set/read/clear helper + 재export |
| `src/app/api/auth/kakao/start/route.ts` | next 재검증 후 쿠키 저장, 없거나 무효면 삭제 |
| `src/app/api/auth/kakao/callback/route.ts` | 쿠키 재검증 → 성공 시 redirect, 성공·실패 모두 쿠키 삭제, 실패 시 next 쿼리 유지 |
| `src/app/login/page.tsx`, `src/widgets/auth/LoginScreen.tsx` | 검증된 next 를 hidden input 으로 |
| `src/features/auth/test/login-next.test.ts` | 단위 테스트(신규) |
| `src/e2e/auth/login-next.spec.ts` | e2e(신규, 미실행) |
| `src/e2e/support/mock-backend-server.mjs` | `/api/auth/kakao/token` 추가, requestId 별 재추천 카운트 |
| `src/e2e/course/course-new.spec.ts` | 소진 토스트 확인 시점 이동 |

## 요구사항 충족 여부
| AC | 결과 | 근거 |
|---|---|---|
| must: `/login?next=<내부 경로>` → 로그인 성공 시 그 경로(쿼리 포함, fragment 제외) | 충족 | `app/login/page.tsx:21`, `widgets/auth/LoginScreen.tsx:89`, `start/route.ts:34-36`, `callback/route.ts:44,65`, `oauth.ts:60`(fragment 제거). 단위 `login-next.test.ts:28,109-121` |
| must: next 없거나 무효면 `/` | **부분 충족(P1)** | AC 열거 항목(외부 URL, `//host`, `/\`, `/api/*`, `/login`, 제어 문자, 2048자 초과)은 모두 거부(`oauth.ts:44-58`, 테스트 `login-next.test.ts:34-51`). 그러나 `/..//evil.com` 류 입력은 정규화 후 `//evil.com`을 **반환**한다 — 아래 보안 분석 F1 |
| must: next 는 httpOnly 쿠키로만 보관, 콜백 후 성공·실패 모두 삭제 | 충족 | `server-auth-cookies.ts:93-123`(httpOnly·SameSite=Lax·Secure=HTTPS·Path=/·maxAge 600), 성공 `callback/route.ts:67`, 실패 `callback/route.ts:34`(모든 오류 분기가 `redirectToLogin` 경유: 47,51,55,59,80) |
| must: 실패·취소 후 재시도에도 next 유지 | 충족 | `callback/route.ts:31` → `oauth.ts:129-132` → `/login?...&next=` → page 재검증. 테스트 `login-next.test.ts:136-148` |
| must not: 클라이언트 JS 에서 next 쿠키 읽기/쓰기 | 충족 | `dayro_oauth_next` 접근은 `shared/api/server-auth-cookies.ts`(서버 전용)뿐. `LoginScreen`은 서버 컴포넌트, hidden input 만 렌더 |
| should: 코스 지도 저장 401 → 로그인 → 같은 코스 지도 복귀 | 부분 확인 | next 생성 `features/course-map/hooks/useCourseMapScreen.ts:97-100`(pathname+search), sanitize 통과 확인(`login-next.test.ts:22,27`). sessionStorage 흐름 상태 복원은 e2e/수동 미검증 |

## Evidence (검증자가 직접 실행, `frontend/`)
| 명령 | 결과 |
|---|---|
| `npm run lint` | exit 0 — 0 errors, 2 warnings(기존: `public/mockServiceWorker.js`, `useWheelColumn.ts` 미사용 import, 이번 변경 무관) |
| `npx tsc --noEmit -p .` | exit 0 |
| `npm run test:unit` | 671 passed / 2 failed — 실패 2건은 알려진 기존 flake(`src/features/faq/test/contact-form.test.tsx` 5s timeout). 단독 재실행 `npx vitest run src/features/auth/test/login-next.test.ts src/features/faq/test/contact-form.test.tsx` → 26/26 pass |
| `npm run build` | exit 0 (`/login` ƒ dynamic) |
| `node scripts/check-route-bundle-budget.mjs` | exit 0 (`/login` 630940B / 한도 641644B) |
| e2e | **미실행**(지시상 금지, 사용자 소유 dev 서버 3000 실행 중). evidence 로 사용하지 않음 |
| 우회 시도 스크립트 | 실제 `oauth.ts` 사본을 `node --experimental-strip-types`로 import 해 page→start→callback 체인 추적(scratchpad, 저장소 비변경) |

## 보안 분석 — `sanitizeLoginNextPath` 우회 시도
기준: callback 은 `new URL(next, request.url)`(`callback/route.ts:65`). 아래 "callback 해석"은 origin `https://dayro.app` 기준.

| 입력 | sanitize 결과 | callback 해석 | 판정 |
|---|---|---|---|
| `https://evil.example/phish` | null | `/` | 안전 |
| `//evil.example` | null | `/` | 안전 |
| `/\evil.example`, `/%5C%5Cevil.com` | null / `/%5C%5Cevil.com` | `/` / 같은 origin 경로 | 안전 |
| `/%2F%2Fevil.com` | `/%2F%2Fevil.com` | `https://dayro.app/%2F%2Fevil.com` | 안전(인코딩 유지, 같은 origin) |
| `/\t/evil.com` 등 제어 문자 | null | `/` | 안전 |
| `/　/`, `/／／evil`, `/ //evil`, `/ //evil` | 퍼센트 인코딩된 경로 | 같은 origin | 안전 |
| `/ /evil` | `/%20/evil` | 같은 origin | 안전 |
| ` /evil`(공백 선행), `data:...`, `javascript:...`, `saved/12` | null | `/` | 안전 |
| `/@evil.com`, `/?x=//evil`, `/#//evil` | 그대로 / `/` | 같은 origin | 안전 |
| `/.%2F/evil.com`, `/..%2F/evil.com` | 그대로 | 같은 origin | 안전 |
| `/login`, `/login/`, `/login//`, `/a/../login`, `/api`, `/a/../api/auth/logout` | null | `/` | 안전 |
| `/Login`, `/API/auth/logout`, `/login;x`, `/%6cogin`, `/%61pi/auth/logout` | 그대로 통과 | 같은 origin | 안전(deny-list 우회지만 같은 origin 이동일 뿐, P3 참고) |
| 2048자 / 2049자 | 통과 / null | 같은 origin | 안전 |
| **`/..//evil.com`, `/.//evil.com`, `/a/..//evil.com`, `/%2e%2e//evil.com`, `/%2e//evil.com`** | **`//evil.com`** | **`https://evil.com/`** | **취약(F1)** |

### F1 상세 (P1)
- 위치: `src/features/auth/model/oauth.ts:47-60`. 사전 검사(`startsWith("//")`)는 **원본 문자열**에만 적용되고, WHATWG URL 정규화(dot-segment 제거) 후의 `url.pathname`이 `//`로 시작하는지는 다시 보지 않는다. 결과적으로 함수가 protocol-relative URL `//evil.com`을 "안전한 경로"로 반환한다(비멱등: `s(s(x)) ≠ s(x)`).
- 현재 체인에서의 영향(직접 추적):
  - page(`/login?next=/..//evil.com`) → hidden input 값 `//evil.com` → start 재검증 → null(쿠키 삭제) → 홈. 차단됨.
  - 공격자가 `/api/auth/kakao/start?next=/..//evil.com`로 직접 링크 → start 가 **`//evil.com`을 쿠키에 저장** → callback 재검증 `s("//evil.com")` = null → 홈. 차단됨(우연히 이중 검증 덕분).
  - **쿠키에 원본 `/..//evil.com`이 들어가면**(서브도메인 cookie tossing, 다른 XSS, 브라우저 확장 등 쿠키 주입) callback 이 `s(cookie)` = `//evil.com` → `Location: https://evil.com/` **오픈 리다이렉트 성립**. SDD/도메인 문서가 명시한 "쿠키 값도 신뢰하지 않고 다시 검증"(`callback/route.ts:43`) 방어가 이 입력 군에서 무력화된다. 단위 테스트의 쿠키 변조 케이스(`login-next.test.ts:123-134`)는 `//evil.example`만 다뤄 이 경로를 놓쳤다.
  - 부수 영향: 검증 실패한 값(`//evil.com`)이 hidden input 과 next 쿠키에 기록된다(`page.tsx:21`, `start/route.ts:34-36`) — "검증을 통과한 내부 경로만 전달" 계약 위반.
- 수정 제안: 파싱 후 결과를 다시 검사한다.
  ```ts
  const url = new URL(raw, LOGIN_NEXT_BASE);
  if (url.origin !== LOGIN_NEXT_BASE || url.pathname.startsWith("//")) return null;
  ```
  (또는 반환 직전 `const out = ...; return sanitize 조건(out) 재통과 시에만 out` 으로 멱등성 보장.) 테스트 추가: `rejects` 목록에 `/..//evil.com`, `/.//evil.com`, `/%2e%2e//evil.com`, `/a/..//evil.com`; callback 쿠키 변조 케이스에 `/..//evil.com` → `http://localhost:3000/` 기대.

### 쿠키 속성·생명주기
- `server-auth-cookies.ts:21-28,93-102`: httpOnly, SameSite=Lax(카카오 → callback top-level GET 이동에 쿠키 전송됨), Secure=`request.nextUrl.protocol === "https:"`, Path=/, maxAge=600(state 와 동일). 삭제는 같은 속성 + maxAge 0(`:118-123`) — 속성 일치로 정상 삭제.
- start 에서 next 없을 때 이전 쿠키 삭제(`start/route.ts:37-38`) — 이전 시도 값 잔존 방지 확인.
- 단, `oauth_config_missing` 조기 반환(`start/route.ts:18-21`)은 쿠키를 지우지 않음 — 10분 후 만료, 영향 미미(P3 아님, 메모).

## Server/Client 경계
- `app/login/page.tsx:1`이 `@/features/auth/model/oauth`를 직접 import. 해당 모듈은 `"use client"`·`next/headers`·브라우저 API 없음(순수 함수, `crypto.randomUUID`는 page 에서 호출되지 않음) → client 코드 유입 없음. `start`/`callback` route 가 이미 같은 deep import 선례를 사용. `server-client-boundary.md:33`의 "page 는 서버 전용 배럴/helper 만 import" 취지(클라이언트 배럴 공유 금지)에는 위배되지 않음. 배럴(`features/auth/index.ts`) 변경 없음 → client-safe 배럴 오염 없음.
- `LoginScreen`(widget, 서버 컴포넌트)은 prop 만 받아 hidden input 렌더 — 인증 로직 없음. 접근성: `type="hidden"` 입력은 보조기술에 노출되지 않아 레이블 불필요(accessibility.md 위반 없음).
- next 쿠키 helper 는 `shared/api/server-auth-cookies.ts`에만 존재(bff.md 준수).

## e2e 접근 및 mock 변경 평가(코드 리뷰만, 실행 안 함)
- `/api/auth/kakao/start`를 `route.fetch(maxRedirects:0)`로 실제 서버 응답을 받아 state/next Set-Cookie 를 `addCookies`로 주입하고 콜백으로 302 — 카카오 외부 이동 없이 서버 로직(start·callback)을 실제로 통과시킨다는 점에서 타당. kakao 도메인 abort 로 외부 유출 방지도 적절.
- 최종 화면 대신 callback `Location`을 검증하는 이유(localhost vs 127.0.0.1 origin 차이)는 납득 가능. 다만 그 결과 "쿠키가 브라우저에서 자연스럽게 왕복"되는지와 최종 화면 렌더는 e2e 로도 확인되지 않는다(단위 테스트로 보완됨).
- `login-next.spec.ts:15-19`: start 응답에 `location`이 없으면 `new URL("", requestUrl)` = 같은 origin → **무한 루프**(테스트 타임아웃까지 hang). P3.
- mock-backend: `request-N` 고유 ID + requestId 별 카운트는 병렬 간섭을 줄이는 안전한 변경. 다른 e2e 가 `request-1`에 의존하는지 확인 — `course-new.spec.ts:225`는 레거시 URL 제거 검증용 문자열일 뿐 mock 과 무관. 알 수 없는 requestId 의 `/retry`도 이제 200 을 반환(이전엔 fall-through) — 테스트 관대화이나 위험 낮음. `retryCountByRequestId`는 reset 시 비우지 않아 프로세스 수명 동안 증가(e2e 규모상 무시 가능).
- `course-new.spec.ts` 토스트 확인을 마지막 재추천 직후로 이동 — 2초 자동 사라짐 race 해소로 타당.

## Pre-existing 보안 관찰(이번 PR 범위 밖, 다가올 보안 리뷰로 이관)
- `app/login/page.tsx:18` → `LoginScreen.tsx:33,56-62`: `message` 쿼리를 그대로 오류 문구로 렌더. React 이스케이프로 XSS 는 아니나, `/login?message=...`로 임의 문구(피싱성 안내) 삽입 가능(content spoofing). 또한 `callback/route.ts:75-78`이 백엔드 예외 메시지를 URL 에 실어 내부 오류 문구가 노출될 수 있음. 동작은 이번 변경 전과 동일.
- Secure 판정이 `request.nextUrl.protocol` 기반 — TLS 종료 프록시 뒤에서 http 로 보이면 Secure 미설정 가능(기존 state/token 쿠키와 동일 정책).

## Failure Taxonomy / Findings
| ID | 등급 | 분류 | 위치 | 내용 |
|---|---|---|---|---|
| F1 | P1 | security / open redirect | `src/features/auth/model/oauth.ts:47-60` | 정규화 후 `//` 재검사 누락 → `/..//evil.com` → `//evil.com` 반환. 쿠키 주입 시 callback(`callback/route.ts:44,65`)이 `https://evil.com/`로 redirect |
| F2 | P2 | test gap | `src/features/auth/test/login-next.test.ts:34-51,123-134` | dot-segment 우회 입력·멱등성 케이스 부재로 F1 미검출 |
| F3 | P3 | test robustness | `src/e2e/auth/login-next.spec.ts:15-19` | location 없는 응답 시 무한 루프 |
| F4 | P3 | 정보성 | `oauth.ts:56-58` | `/API/`, `/%61pi/...`, `/%6cogin`, `/login;x` 등 deny-list 대소문자·인코딩 우회. 같은 origin 이라 보안 영향 없음, 404/로그인 화면 이동 정도 |

## VSA 준수
- 위반 없음. 순수 검증은 `features/auth/model`, 쿠키 I/O 는 `shared/api/server-*`, 조합은 widget, 라우팅은 app. 파일 책임 과밀 없음.

## 최종 결정
**`rejected`** — 오픈 리다이렉트 방지가 이 작업의 핵심 보안 계약인데, 검증 함수가 off-origin 값을 반환하는 입력 군이 존재하고 SDD 가 명시한 "쿠키 변조 방어"가 이 입력 군에서 깨진다. 현재 정상 흐름에서는 start/callback 이중 검증으로 우연히 차단되므로 즉시 악용 난이도는 높다(쿠키 주입 전제). F1 한 줄 수정 + F2 테스트 추가 후 재검증 시 나머지 AC·evidence 는 통과 상태라 `approved_with_notes` 예상.

## 남은 리스크 / 후속
- F1·F2 수정 후 `npm run test:unit` 재실행 및 재검증.
- e2e(`src/e2e/auth/login-next.spec.ts`)는 사용자 실행 결과로 확인 필요.
- should AC(코스 지도 흐름 상태 복원)는 수동/e2e 확인 필요.
- pre-existing `message` 쿼리 렌더는 보안 리뷰 백로그로.

## 라운드 2 — 재검증
- date: 2026-10-05
- decision: **`approved_with_notes`**

### 수정 확인
| 라운드 1 finding | 조치 | 확인 |
|---|---|---|
| F1 (P1) 정규화 후 `//` 반환 | `oauth.ts`: 정규화된 `url.pathname.startsWith("//")` 거부, 차단 목록 대소문자 무시 + `/login;` 차단, 결과 재해석 same-origin 확인 | 해소. `/..//evil.com` 류 전부 null, callback 변조 쿠키도 홈 |
| F2 (P2) 테스트 공백 | `login-next.test.ts:49-53`(dot-segment 거부), `:45-46`(대소문자), `:62-66`(accepted 값 멱등), `:140`(변조 쿠키 3종 → `http://localhost:3000/`) | 해소 |
| F3 (P3) e2e 무한 루프 | `login-next.spec.ts:15-18` 5 hop 제한 + location 없으면 throw | 해소(5 hop 소진 시 그대로 진행하지만 이후 단계에서 실패하므로 hang 없음) |
| F4 (P3) 인코딩 same-origin 우회 | 미변경(합의) | 유지, 보안 영향 없음 |

### 우회 재시도 (수정된 실제 `oauth.ts` import, callback origin `https://dayro.app` 기준)
| 입력 | 결과 | callback 해석 |
|---|---|---|
| `/..//evil.com`, `/.//evil.com`, `/a/..//evil.com`, `/../..//evil.com`, `/..///evil.com` | null | `/` |
| `/%2e%2e//evil.com`, `/%2E%2E//evil.com`, `/%2e//evil.com`, `/.%2e//evil.com` | null | `/` |
| `"/" + "../"×600 + "/evil.com"`, `"./"×1000`, `"%2e%2e/"×300` (긴 dot 시퀀스) | null | `/` |
| `/\t/evil`, `/\n//evil`, `/a\tb` | null | `/` |
| `/%2F%2Fevil`, `/..%2F/evil`, `/%2e%2e%2f/evil` | 그대로(인코딩 유지) | same-origin |
| `/∕∕evil`(U+2215), `/／／evil`, `/　//evil` | 퍼센트 인코딩 경로 | same-origin |
| `/;//evil`, `/..;//evil.com`, `/?//evil`, `/@evil`, `/:evil`, `/http://evil`, `/https:evil.com` | 그대로 | same-origin |
| `/#//evil` | `/` | same-origin |
| `/API/x`, `/Login`, `/login;x`, `/LOGIN;x` | null | `/` |
| `/login/;x`, `/login%3Bx`, `/%6cogin`, `/%61pi/x` | 그대로 | same-origin(404/로그인 화면 이동, 영향 없음) |
| 랜덤 퍼징 300,000건(`/ \ . .. %2e %2f %5c ; ? # @ : ∕ ／ U+3000 %09 %00 login api API //` 조합) | 214,440건 통과 | **off-origin 0건, 비멱등 0건, `/login`·`/api` 정규 경로 통과 0건** |
| `buildLoginErrorSearchParams({next:"/..//evil.com"})` | `error=x`(next 미포함) | — |

### Evidence (라운드 2, 검증자 직접 실행)
| 명령 | 결과 |
|---|---|
| `npm run lint` | 0 errors, 2 warnings(기존·무관) |
| `npx tsc --noEmit -p .` | OK |
| `npm run test:unit` | 683 passed / 2 failed — 기존 flake `contact-form.test.tsx`(단독 재실행 pass). `npx vitest run src/features/auth` 75/75 |
| `npm run build` | exit 0 |
| `node scripts/check-route-bundle-budget.mjs` | exit 0 (`/login` 630940B / 641644B) |
| e2e | 검증자 미실행. Claude 보고 18/18(start 모드, 사용자 승인)은 참고로만 기록 |

### 남은 notes (차단 아님)
- N1 (P3, defense-in-depth): `/%2F%2Fevil`, `/%5C%5Cevil`처럼 퍼센트 인코딩된 슬래시·역슬래시는 통과한다. 함수 수준에서는 same-origin 이지만, callback 이후 Next `trailingSlash: true` 308 등 하위 리다이렉트가 경로를 디코딩해 `Location: //evil/`을 만드는지는 서버 미기동 제약으로 검증하지 못했다. 원하면 `%2f`/`%5c`(대소문자 무시)를 차단 목록에 추가하는 것을 권장.
- N2 (P3): 코드 주석의 "멱등" 검사는 실제로는 결과의 same-origin 재확인이다(퍼징상 실제 멱등도 성립). 주석 표현만 정확하지 않음.
- 라운드 1의 pre-existing 관찰(`message` 쿼리 렌더, 백엔드 오류 문구 URL 노출, 프록시 뒤 Secure 판정)과 should AC(코스 지도 흐름 상태 복원 수동 확인)는 그대로 후속.

### 최종 결정 (라운드 2)
**`approved_with_notes`** — P1/P2 해소, 모든 must AC 충족, evidence gate 통과. N1·N2는 후속 개선 권장 사항.
