# MSW 운영 구조

## 목적
- 브라우저가 직접 가져가야 하는 worker 파일과, 저장소에서 관리하는 mock 규칙 코드를 분리한다.
- Storybook, 향후 브라우저 개발 mock, 테스트 지원 코드가 같은 mock 규칙을 재사용할 수 있게 한다.

## 파일 역할
- `public/mockServiceWorker.js`
  - MSW가 브라우저에서 요청을 가로채기 위해 사용하는 정적 worker 파일
  - 생성물이며 직접 수정하지 않는다
- `src/mocks/handlers.ts`
  - 여러 실행 환경에서 공통으로 재사용할 수 있는 기본 mock handler 목록
- `src/mocks/handlers/*.ts`
  - 도메인별 mock handler 정의
- `src/mocks/storybook-handlers.ts`
  - Storybook에서만 추가로 필요한 handler를 합성하는 진입점

## 운영 규칙
- worker 파일은 `public/`에만 둔다.
- handler 코드는 `src/` 아래에서 타입과 import를 유지한 채 관리한다.
- Storybook 전용 mock이 아니면 먼저 `handlers.ts`에 추가하고, Storybook 진입점에서 합성한다.
- Storybook 전용 임시 mock을 만들더라도 가능하면 공통 handler와 구분해서 관리한다.
- 현재 기본 mock은 `auth`, `situation` BFF 계약을 포함한다.
