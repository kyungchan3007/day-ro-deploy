# 서버-클라이언트 경계 가이드

## 목적
이 문서는 Next.js에서 서버 전용 코드와 클라이언트 코드를 import graph 수준에서 분리하기 위한 강제 기준이다.

이 가이드는 `next/headers`, 쿠키/헤더 처리, 서버 전용 fetch 유틸이 클라이언트 번들에 섞이는 사고를 막기 위해 존재한다.

## 핵심 원칙
- 서버 전용 코드는 직접 import 하지 않았더라도 클라이언트 import graph 에 연결되면 구조 위반이다.
- 하나의 feature public API 배럴에 client-safe export 와 server-only export 를 함께 두지 않는다.
- `use client` 파일, client component, widget, browser hook 이 보는 배럴은 반드시 client-safe 해야 한다.
- page, layout, Server Component, Route Handler 가 보는 서버 전용 export 는 별도 server entry 로 분리한다.

## 트리거 조건
다음 중 하나라도 해당하면 이 문서를 작업 전에 읽고 반영한다.

- `next/headers`, `cookies()`, `headers()`를 사용한다.
- `src/shared/api/server-*.ts`, `src/features/*/server/**`, `src/app/**/page.tsx`, `src/app/api/**`를 추가/수정한다.
- feature `index.ts` 또는 barrel export 를 추가/수정한다.
- `use client` 파일이 feature 배럴을 import 한다.
- SSR page data 함수, Server Component 전용 helper, Route Handler helper 를 만든다.

## Intent 연결
- `SDD`는 client-safe / server-only 경계 결정을 내릴 때 이 문서를 기준으로 삼는다.
- `Execution Spec`은 어떤 파일과 export가 실제 변경 범위인지 고정할 때 이 문서를 참조한다.
- 이 문서는 경계 규칙의 원본이며, 작업 범위 자체는 intent 문서가 정의한다.

## 강제 분리 규칙
- `src/features/<domain>/index.ts`에는 client-safe export 만 둔다.
- 서버 전용 공개 진입점은 `src/features/<domain>/server/index.ts`처럼 별도 엔트리로 분리한다.
- `src/shared/api/server-*.ts`를 import 하는 모듈은 client-safe 배럴에서 재export 하지 않는다.
- `next/headers`를 import 하는 파일은 client component, widget client file, browser hook graph 에 연결되면 안 된다.
- page.tsx, layout.tsx, Route Handler, Server Component 는 서버 전용 배럴 또는 서버 전용 helper 만 import 한다.
- client component 가 feature 배럴을 import할 때, 그 배럴에서 서버 함수가 단 하나라도 함께 export 되면 위반이다.

## 권장 배치
- client-safe public API: `src/features/<domain>/index.ts`
- server-only public API: `src/features/<domain>/server/index.ts`
- 서버 계약 함수: `src/features/<domain>/server/*.ts`
- 서버 공통 transport: `src/shared/api/server-*.ts`

## 구현 절차
1. 먼저 이 변경이 client graph 인지 server graph 인지 구분한다.
2. 새 export 가 client-safe 인지 server-only 인지 먼저 적는다.
3. client-safe 와 server-only 가 섞이면 배럴을 분리한다.
4. `use client` 파일이 import 하는 feature entry 에 서버 export 가 없는지 확인한다.
5. 구현 후 `next/headers`, `cookies()`, `headers()` import 경로가 client graph 와 연결되지 않는지 점검한다.

## 체크리스트
- 이 배럴은 client-safe export 만 갖고 있는가?
- 서버 전용 page-data 함수가 별도 `server` 엔트리에 있는가?
- `next/headers`를 쓰는 파일이 client import graph 밖에 있는가?
- client component 가 server helper 를 재export 하는 배럴을 보지 않는가?
- page/layout/Route Handler 와 client widget 이 같은 feature 배럴을 공유하지 않는가?

하나라도 `no`이면 경계 분리가 덜 된 것으로 본다.

## 금지 예시
- `src/features/saved/index.ts`에서 `SavedCourseCard`와 `getSavedPageData`를 함께 export 하는 것
- `use client` widget 이 `@/features/<domain>`을 import 하는데, 같은 배럴 뒤에 `next/headers` 의존 서버 함수가 숨어 있는 것
- `shared/api/server-*.ts`를 feature public API 배럴에서 다시 export 하는 것

## 검증 기준
- FeatureAgent는 배럴 export 를 수정할 때 client-safe/server-only 분리 여부를 작업 응답에 명시한다.
- ValidationAgent는 feature 배럴이 서버 export 를 포함하는지 확인한다.
- `next/headers`가 보이면 단순 사용 위치만 보지 않고 import graph 오염 여부까지 확인한다.
