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

## 테스트 기준
- 계약 테스트: endpoint path, request/response schema
- 서버 테스트: 쿠키 저장/제거, refresh 성공/실패, 로그아웃 정리
- feature API 테스트: BFF 요청/응답 계약과 ViewModel 변환
- 인증 작업은 최소한 성공 케이스와 세션 만료 케이스를 포함한다

## 금지 사항
- 클라이언트 컴포넌트에서 `process.env.BACKEND_API_BASE_URL` 사용
- 클라이언트 코드에서 외부 백엔드 절대 URL fetch
- feature/UI 파일에서 access token, refresh token 직접 조합
- BFF 없이 브라우저에서 Authorization 헤더 직접 조합
- page/layout/Server Component 에서 외부 백엔드 transport 파일 직접 import
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
