# BFF 운영 지침

## 목적
- 프론트엔드가 외부 백엔드와 통신할 때 BFF, Backend For Frontend, 경계를 일관되게 유지한다.
- 인증, 쿠키, 토큰, 헤더, 에러 변환 책임을 클라이언트 UI 밖으로 밀어낸다.
- 에이전트와 사람이 임의 방식으로 API를 추가해 구조가 흔들리는 일을 막는다.

## 적용 범위
다음 중 하나라도 해당하면 이 문서를 먼저 읽고 반영한다.

- `src/app/api/**` Route Handler 추가/수정
- `src/shared/api/**` 추가/수정
- `src/features/*/api` 추가/수정
- 외부 백엔드 API 연동
- 인증, 토큰, 쿠키, 세션, 헤더 조합 변경
- SSR/Server Component 데이터 준비 방식 변경
- 클라이언트에서 서버 데이터 요청 구조 변경

## Intent 연결
- `PRD`는 BFF 필요 이유와 범위를 설명할 수 있다.
- `SDD`는 BFF 경계, route 위치, 서버 계층 책임을 설계할 때 이 문서를 호출한다.
- `Execution Spec`은 실제 endpoint/schema/feature api 반영 범위를 고정할 때 이 문서를 호출한다.
- 이 문서는 intent를 대체하지 않고, BFF 구현/검증 규칙의 원본만 제공한다.

## 절대 원칙
- 클라이언트 컴포넌트는 외부 백엔드 API를 직접 호출하지 않는다.
- 외부 백엔드와의 HTTP 통신은 BFF 또는 서버 계층에서만 수행한다.
- 인증 토큰, 쿠키, Authorization 헤더 조합은 BFF 또는 서버 계층 책임이다.
- feature의 `api`는 외부 백엔드가 아니라 BFF endpoint만 호출한다.
- UI는 가능한 한 도메인 요구사항만 알고, 토큰 구조나 백엔드 에러 형식은 알지 않게 한다.
- BFF는 단순 프록시가 아니라 프런트 요구사항을 반영하는 안정적인 계약 계층이다.
- BFF 응답 형식은 `src/shared/api/openapi/dayro.openapi.ts` 기준으로 관리한다.
- 서버 데이터 작업은 구현 전에 SSR 우선 여부를 먼저 판정한다.
- 초기 렌더에 필요한 데이터는 클라이언트 fetch보다 Server Component 또는 page/layout 준비를 우선한다.
- SSR 가능성과 클라이언트 상호작용 이후 호출의 경계가 애매하면 구현 전에 사용자에게 확인한다.

## 용어

### 외부 백엔드 API
- Spring 등 별도 서버가 제공하는 실제 비즈니스 API
- 예: `http://localhost:8080/api/auth/refresh`

### BFF endpoint
- Next.js `app/api/**/route.ts`에 구현된 프런트 전용 서버 경계
- 브라우저, feature, page, server component가 호출하는 진입점
- 예: `/api/auth/refresh`

### 서버 계층
- BFF 내부에서 재사용하는 서버 전용 유틸리티
- 예: 쿠키 읽기/쓰기, 외부 백엔드 호출 client, auth helper

## 책임 분리

### `src/app/api/**`
- BFF Route Handler 위치
- 요청 파싱, 인증 쿠키 읽기, 서버 계층 호출, 응답/쿠키 작성 담당
- 도메인 규칙이 과하면 feature/model 또는 서버 계층으로 내린다

### `src/shared/api/endpoints.ts`
- 브라우저와 feature가 호출할 BFF endpoint 경로 상수 관리
- 외부 백엔드 절대 URL을 두지 않는다

### `src/shared/api/openapi/dayro.openapi.ts`
- BFF 요청/응답 계약, schema, 타입 관리
- path, request schema, response schema를 여기에 모은다
- feature가 기대하는 안정적인 계약은 이 파일을 기준으로 맞춘다

### `src/shared/api/server-*.ts`
- 쿠키, 인증, 공통 fetch, 헤더 조합 등 서버 전용 로직 위치
- 브라우저 번들에 섞이면 안 되는 코드를 여기에 둔다
- 외부 백엔드 transport 와 프런트 서버 계약 계층을 분리한다
- page/layout/Server Component/Route Handler 는 transport 를 직접 import하지 말고 프런트 서버 계약 계층만 사용한다
- 서버 계층 함수에는 역할, 입력 인자, 반환 계약, 다음 호출 대상(backend transport 또는 BFF 계약)을 주석으로 남긴다
- 이 파일을 client-safe feature 배럴에서 재export 하지 않는다

### `src/features/*/api`
- feature 전용 BFF 호출 함수 위치
- UI 요구사항에 맞춘 request builder, response mapping, ViewModel 정리 담당
- 외부 백엔드 base URL, 토큰, 쿠키 처리 금지

## 기본 설계 순서
1. 도메인 문서에서 action, state, route, out-of-scope를 확인한다.
2. 이 데이터가 초기 렌더 전에 필요한지, 사용자 상호작용 이후에만 필요한지 먼저 구분한다.
3. 초기 렌더 데이터면 Server Component, page, layout 에서 먼저 준비할 수 있는지 본다.
4. 위 판단이 애매하면 구현 전에 사용자에게 확인한다.
5. BFF가 필요하면 `src/shared/api/endpoints.ts`에 경로를 추가한다.
6. `src/shared/api/openapi/dayro.openapi.ts`에 path와 schema를 추가한다.
7. 공통 서버 로직이 필요하면 `src/shared/api/server-*.ts`에 둔다.
8. Route Handler를 `src/app/api/**/route.ts`에 만든다.
9. feature `api`가 필요하면 BFF endpoint만 호출하도록 작성한다.
10. 테스트는 계약, 쿠키, 인증, 실패 케이스 중심으로 작성한다.

## BFF가 필요한 경우
- 브라우저에 노출되면 안 되는 인증 정보가 필요한 경우
- access token, refresh token, 쿠키를 서버에서 읽어야 하는 경우
- 외부 백엔드 응답을 프런트 요구사항 형식으로 바꿔야 하는 경우
- 여러 외부 호출을 하나의 프런트 응답으로 합쳐야 하는 경우
- 서버에서만 가능한 리다이렉트, 헤더 조작, 쿠키 설정이 필요한 경우
- CORS, 비밀키, callback 처리 등 브라우저 직접 호출이 부적절한 경우

## BFF를 만들지 않는 경우
- 단순 정적 콘텐츠 렌더링
- 외부 백엔드 호출 없이 Server Component에서 준비 가능한 내부 데이터
- 브라우저에서 직접 처리해도 보안/계약 문제가 없는 순수 클라이언트 상태

## Route Handler 작성 기준
- 파일 위치는 `src/app/api/<domain>/<action>/route.ts`를 우선한다.
- 메서드는 HTTP 의미에 맞게 선택한다.
  - `GET`: 조회
  - `POST`: 생성, 처리 요청, callback, refresh
  - `PATCH`/`PUT`: 수정
  - `DELETE`: 삭제, 로그아웃
- 성공 응답과 실패 응답 형식은 가능한 한 일관되게 유지한다.
- Route Handler 본문은 얇게 유지한다.
- 중복되는 쿠키 처리, 에러 파싱, 인증 헤더 구성은 서버 계층으로 내린다.

## 인증/세션 기준
- access token, refresh token은 브라우저 JS에서 직접 다루지 않는다.
- 토큰 저장/삭제는 httpOnly cookie를 기본값으로 한다.
- refresh token으로 access token을 재발급하는 진입점은 BFF가 제공한다.
- 백엔드가 Authorization 헤더를 요구하면 BFF가 쿠키를 읽어 헤더를 조립한다.
- 로그아웃은 가능하면 백엔드 세션 정리와 로컬 쿠키 제거를 함께 처리한다.
- refresh 실패 시 만료된 세션 쿠키는 정리한다.

## 에러 처리 기준
- 백엔드 에러를 무조건 그대로 노출하지 않는다.
- BFF는 프런트에서 처리 가능한 메시지와 상태코드로 정리한다.
- 인증 실패, 권한 없음, 입력 오류, 서버 오류를 구분한다.
- 백엔드 응답 형식이 불안정할 수 있으므로 fallback message를 둔다.
- 사용자에게 보여줄 수 없는 내부 구현 정보는 응답 메시지에 넣지 않는다.

## 응답 변환 기준
- BFF 응답이 UI 요구와 다르면 BFF 또는 feature `api`에서 정리한다.
- 외부 백엔드 DTO를 그대로 UI까지 흘리지 않는다.
- 공통 계약은 schema로 검증하고, UI 전용 가공은 `model` 또는 `types`에서 처리한다.

## SSR/Server Component 기준
- 초기 화면 데이터는 가능한 한 Server Component 또는 page/layout에서 준비한다.
- 클라이언트 상호작용 이후에만 필요한 데이터는 feature `api`에서 BFF를 호출한다.
- 인증이 필요한 초기 데이터는 서버 계층에서 쿠키를 읽고 BFF 또는 외부 백엔드로 연결한다.
- 요청 단위 상태를 모듈 전역 mutable 상태에 저장하지 않는다.
- Server Component가 외부 백엔드 fetch 유틸을 직접 import해 Route Handler 와 다른 캐시/에러/계약 경로를 만들지 않는다.
- Route Handler 와 Server Component 가 같은 데이터를 쓰면 같은 `server-*.ts` 서버 계약 함수를 공유한다.
- 자기 자신의 `/api/**` 를 다시 fetch 하는 방식은 최후의 수단으로만 사용한다. 기본값은 공통 서버 계층 공유다.

## SSR 우선 판정 질문
구현 전에 아래 질문을 순서대로 확인한다.

- 이 데이터가 첫 화면 UI를 그리기 전에 이미 필요한가
- 이 데이터 없이도 첫 화면을 안정적으로 렌더할 수 있는가
- 이 데이터가 선택지/기준정보/초기 상세정보처럼 거의 변하지 않는가
- 이 데이터 요청이 사용자 클릭, 입력, 제출 이전에도 발생하는가

위 질문 중 앞의 세 개가 `yes`에 가깝고 마지막 질문도 `yes`이면 SSR 또는 Server Component 준비를 우선한다.

반대로 아래에 가까우면 클라이언트 상호작용 이후 호출로 본다.

- 제출 결과
- 저장/삭제 결과
- 검색/정렬/필터 변경 결과
- 더보기/페이지 이동 결과

판단이 애매하면 구현 전에 사용자에게 물어본다.

## 파일 배치 규칙

### 인증 공통
- `src/shared/api/server-auth-cookies.ts`: 인증 쿠키 읽기/쓰기
- `src/shared/api/server-auth-client.ts`: 외부 auth 백엔드 호출
- `src/app/api/auth/**`: auth BFF route

### 일반 도메인
- 공통 계약: `src/shared/api/openapi/dayro.openapi.ts`
- 공용 경로 상수: `src/shared/api/endpoints.ts`
- feature 전용 호출: `src/features/<domain>/api/**`
- client-safe feature public API: `src/features/<domain>/index.ts`
- server-only feature public API: `src/features/<domain>/server/index.ts`

## 테스트 기준
- 계약 테스트: endpoint path, request/response schema
- 서버 테스트: 쿠키 저장/제거, refresh 성공/실패, 로그아웃 정리
- feature API 테스트: BFF 요청/응답 계약과 ViewModel 변환
- 인증 작업은 최소한 성공 케이스와 세션 만료 케이스를 포함한다

## 서버 환경변수 (운영 배포)
- `BACKEND_API_BASE_URL` (필수): 외부 백엔드 origin. 운영 런타임에서 없으면 `getBackendBaseUrl`이 즉시 실패한다(개발·빌드 단계만 `http://localhost:8080` 대체).
- `KAKAO_REST_API_KEY` (필수): 카카오 인가 요청용 REST 키. 서버 전용.
- `APP_ORIGIN` (권장): 공개 origin(예: `https://<도메인>`). 카카오 `redirect_uri`를 이 값으로 만든다. 없으면 요청 origin 사용 → 프록시 뒤에서 내부 host 가 들어갈 수 있음.
- `CSP_REPORT_URI` (선택, 빌드 시점): CSP 위반 외부 수집처(https 절대 URL, 예: Sentry security endpoint). 없으면 BFF `/api/csp-report/` → 서버 로그 `[CSP] 위반`.
- `AUTH_COOKIE_ALLOW_INSECURE` (운영 금지): `1`이면 운영 빌드에서도 http 인증 쿠키 허용. 로컬 운영 빌드·e2e start 모드 전용.
- `NEXT_PUBLIC_*`(GA·Meta·Kakao 지도 키·분석 on/off)는 공개값. Kakao 지도 키는 Kakao 콘솔에서 도메인 제한 필수.

## 보안 기준 (issue #139)
- httpOnly 쿠키에 둔 토큰을 응답 본문·URL 에 다시 싣지 않는다(refresh BFF 는 본문 `data: null`).
- 경로 파라미터는 백엔드 계약 형식으로 검증하고 `encodeURIComponent`로 붙인다(저장 코스 id = UUID, `buildCourseDetailPath`).
- 로그인 화면 문구는 `error` 코드 → 고정 문구 매핑만 쓴다. 자유 문구 쿼리(`message`)·백엔드 예외 메시지를 URL 에 싣지 않는다.
- 인증 쿠키 Secure: HTTPS·`x-forwarded-proto: https`·운영 빌드면 항상 Secure. 예외는 요청 값이 아닌 서버 설정(`AUTH_COOKIE_ALLOW_INSECURE=1`)으로만.
- `APP_ORIGIN`은 백엔드 `KAKAO_REDIRECT_URI`와 같은 origin 이어야 한다(카카오 콘솔 등록값과 일치).
- 보안 헤더 구성은 `src/shared/config/security-headers.ts`(`next.config.ts`가 사용, 단위·e2e 테스트로 고정). CSP 위반은 `report-uri`·`report-to`로 수집.
- 보안 헤더는 `next.config.ts` `headers()`에서 관리: 강제 CSP(frame-ancestors·base-uri·object-src), 전체 허용 목록은 Report-Only, XFO·nosniff·Referrer-Policy·Permissions-Policy. 외부 스크립트·요청 출처를 추가하면 Report-Only 목록도 함께 갱신한다.

## 오류 상태·문구 규칙 (issue #139 S8)
- transport 는 백엔드 오류를 `BackendApiError(status, message)`로 던진다(`shared/api/backend-error.ts`). 본문은 `readBackendJson`으로 읽어 JSON 이 아니면 `null`(파싱 오류 문구 노출 금지).
- 문구: 백엔드 4xx·503 은 백엔드 `ApiResponse.message`(ErrorCode·검증 메시지), 그 밖의 5xx·비JSON·네트워크·응답 계약 불일치는 엔드포인트별 고정 문구.
- 상태: 백엔드 4xx 그대로(400·401·403·404·409·429), 503 그대로, 그 밖의 5xx·네트워크·계약 불일치는 502. Route Handler 는 `bffErrorResponse(error, fallback, emptyData)`로 응답한다.
- 입력 검증(400)과 백엔드 호출은 분리한다. 백엔드 응답 ZodError 를 입력 오류로 내보내지 않는다.
- 세션: 토큰 거절(400·401·403)일 때만 쿠키를 지운다. 백엔드 장애·설정 누락은 쿠키를 유지하고 서버 로그만 남긴다(`isBackendAuthRejection`).

## 배포 런타임·보호 화면 세션 (issue #146)
- 운영 런타임은 Cloudflare Workers + OpenNext(`@opennextjs/cloudflare`). 설정 `wrangler.jsonc`·`open-next.config.ts`, 빌드 `npm run cf:build`, 로컬 Workers 확인 `npm run cf:preview`.
- OpenNext 빌드는 `.env*` 파일 값을 Worker 번들(`.open-next/cloudflare/next-env.mjs`)에 그대로 넣는다. 로컬 preview 는 `.env.local`만으로 동작하고, `.dev.vars`는 덮어쓸 값이 있을 때만 쓴다.
- 운영 배포는 Workers Builds(GitHub 연동, `.env.local` 없음)로만 한다. 로컬에서 `opennextjs-cloudflare deploy`를 실행하면 `.env.local` 값(개발용 주소·키)이 운영 Worker 에 들어가므로 로컬 배포 스크립트를 두지 않는다.
- `proxy.ts`·`middleware.ts`를 두지 않는다. OpenNext 에서 Node 미들웨어는 실험 기능이고, 넣으면 Next 서버 런타임이 한 번 더 묶여 Worker 압축 크기가 약 1.7MB → 3.0MB(무료 한도 3MB)로 커진다.
- 보호 화면(Server Component)은 `requireAuthSessionForServerComponent(nextPath)`로 가드한다. access token 없이 refresh token 만 있으면 `/api/auth/restore/?next=`로 보내고, Route Handler 가 refresh 후 쿠키를 심어 되돌린다(Server Component 는 쿠키를 쓸 수 없음).
- 복구 Route Handler: 성공 → `next`, 토큰 거절 → 쿠키 정리 + 로그인, 백엔드 장애 → 쿠키 유지 + 로그인(같은 복구 반복 방지). `next`는 `sanitizeLoginNextPath`로 검증, 실패 시 `/`.
- `/ui-preview`는 `app/ui-preview/layout.tsx`가 운영 빌드에서 `notFound()`.
- `export const runtime = "edge"`를 쓰지 않는다(OpenNext 미지원).

## 서버 전용 가드 (issue #139 S9)
- `shared/api/server-*.ts`·`backend-*.ts`·`features/*/server/*.ts`는 첫 줄에 `import "server-only";`. 클라이언트 컴포넌트에서 import 하면 빌드가 실패한다.
- 단위 테스트(node)는 `vitest.config.ts`에서 `server-only`를 빈 모듈로 alias 한다.

## 금지 사항
- 클라이언트 컴포넌트에서 `process.env.BACKEND_API_BASE_URL` 사용
- 클라이언트 코드에서 외부 백엔드 절대 URL fetch
- feature/UI 파일에서 access token, refresh token 직접 조합
- BFF 없이 브라우저에서 Authorization 헤더 직접 조합
- page/layout/Server Component 에서 외부 백엔드 transport 파일 직접 import
- client component 또는 client-safe feature 배럴에서 `src/shared/api/server-*.ts`에 닿는 export graph 생성
- schema 없이 임의 JSON 구조를 여기저기서 복제
- 서로 다른 도메인의 내부 BFF 유틸을 무분별하게 공유

## 체크리스트
- 이 데이터는 초기 렌더 데이터인가, 상호작용 이후 데이터인가
- 초기 렌더 데이터라면 SSR 또는 Server Component에서 먼저 준비했는가
- 판단이 애매할 때 사용자 확인 없이 임의 결정하지 않았는가
- 이 호출은 외부 백엔드인가, BFF인가
- 클라이언트가 외부 백엔드를 직접 호출하고 있지 않은가
- endpoint path가 `src/shared/api/endpoints.ts`에 있는가
- request/response schema가 `dayro.openapi.ts`에 있는가
- 쿠키/토큰/헤더 조합이 서버 계층에 있는가
- Route Handler가 과도하게 두꺼워지지 않았는가
- Server Component, Route Handler, shared server 함수에 역할 설명 주석이 있는가
- 실패 시 상태코드와 메시지가 일관적인가
- 인증 만료/세션 정리 경로가 있는가
- 테스트가 계약과 관찰 가능한 동작을 검증하는가

## 검증 기준
- BFF 작업은 “호출이 된다”가 아니라 “경계 책임이 올바르다”를 완료 조건으로 본다.
- 인증 관련 변경은 쿠키, refresh, logout 경로를 함께 검토한다.
- feature가 외부 백엔드 형식에 직접 결합되어 있으면 완료로 보지 않는다.
