# Features

사용자 기능 또는 도메인 흐름 단위의 vertical slice를 둔다.

## 슬라이스 기준
하나의 feature는 하나의 사용자 목적 또는 도메인 흐름을 담당한다.

예시:
- `auth`
- `onboarding`
- `calendar`
- `schedule`
- `profile`

## 권장 내부 구조
필요한 경우에만 만든다.

```text
feature-name/
  api/
  model/
  hooks/
  ui/
  lib/
  types/
  test/
  index.ts
```

## 내부 역할
- `ui`: feature 전용 화면 컴포넌트와 JSX 렌더링
- `types`: feature 내부 타입, props 타입, DTO, ViewModel 타입
- `model`: 비즈니스 규칙, 상태 모델, 상태 전이, schema, store, query key
- `hooks`: feature 전용 커스텀 훅
- `api`: BFF 통신, 요청 함수, API 타입 매핑
- `lib`: feature 내부 순수 유틸리티

## 의존 방향
- `ui`는 `hooks`, `types`를 사용할 수 있다.
- `hooks`는 `model`, `api`, `types`, `lib`를 사용할 수 있다.
- `model`은 React, DOM, Next.js 라우팅에 의존하지 않는다.
- `types`는 가능하면 다른 내부 계층에 의존하지 않는다.
- `api`는 UI 컴포넌트를 import하지 않는다.
- `lib`는 feature 내부에서만 사용한다.

## BFF API 규칙
- feature의 `api`는 BFF, Backend For Frontend, 호출만 담당한다.
- 클라이언트가 외부 백엔드 API를 직접 호출하지 않는다.
- 외부 API 인증, 토큰, 쿠키, 헤더 조합은 BFF 또는 서버 계층에서 처리한다.
- feature `api`는 화면 요구사항에 맞는 요청/응답 타입을 제공한다.
- BFF 응답을 그대로 UI에 흘리지 않고 필요한 경우 `model` 또는 `types`에서 ViewModel로 정리한다.
- BFF endpoint 변경은 feature public API와 테스트 영향 범위를 함께 확인한다.

## SSR 규칙
- 이 프로젝트는 실시간 데이터 흐름을 기본 전제로 하지 않는다.
- 초기 화면 데이터는 가능한 한 SSR 또는 Server Component에서 가져온다.
- 클라이언트 fetch는 사용자 상호작용 이후 필요한 경우에만 사용한다.
- polling, websocket, subscription은 기본 사용하지 않는다.
- 실시간 처리가 필요하면 요구사항과 사용자 승인을 먼저 확인한다.
- SSR 데이터는 route/page 또는 서버 계층에서 준비하고, feature에는 필요한 데이터만 전달한다.

## 규칙
- 슬라이스 내부 구현은 외부에서 직접 import하지 않는다.
- 외부 공개 API는 `index.ts`에 모은다.
- 공용화는 실제 재사용이 확인된 뒤 `shared`로 이동한다.
- 단순 중복 제거만을 이유로 `shared`로 이동하지 않는다.
- 커스텀 훅은 `hooks`에 둔다.
- React hook이 아닌 비즈니스 규칙은 `model`에 둔다.
