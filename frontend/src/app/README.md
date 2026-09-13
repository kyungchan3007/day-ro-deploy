# App Layer

Next.js App Router 진입점이다.

## 책임
- 라우트 정의
- 페이지 진입점
- 레이아웃 조합
- feature, widget, shared public API 조합

## 규칙
- 비즈니스 로직을 직접 두지 않는다.
- feature 내부 파일을 직접 import하지 않는다.
- feature가 공개한 `index.ts` public API만 사용한다.
- 라우트 전용 설정과 Next.js 특수 파일은 이 계층에 둔다.
- 초기 데이터가 필요한 화면은 SSR 또는 Server Component에서 데이터를 준비한다.
- 외부 백엔드 API는 직접 호출하지 않고 BFF를 통해 호출한다.
- 실시간 처리가 명시되지 않은 화면에서 polling, websocket, subscription을 도입하지 않는다.
