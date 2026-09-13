# Source Architecture

프론트엔드 소스는 VSA, Vertical Slice Architecture 기준으로 구성한다.

## 기본 구조
- `features`: 사용자 기능 또는 도메인 흐름 단위 슬라이스
- `shared`: 둘 이상의 슬라이스에서 실제로 재사용되는 공용 코드
- `entities`: 여러 슬라이스에서 공유되는 핵심 도메인 모델이 있을 때만 사용
- `widgets`: 여러 feature를 조합한 화면 단위 블록이 필요할 때만 사용

## Import 원칙
- `app`은 feature/widget/shared의 public API만 import한다.
- feature 간 내부 파일 직접 import는 금지한다.
- feature 외부 공개는 `index.ts`를 통해서만 한다.
- `shared`는 feature를 import하지 않는다.
- `entities`는 feature를 import하지 않는다.

## Feature 내부 책임
feature 내부는 필요한 경우 `ui`, `types`, `model`, `hooks`, `api`, `lib`로 나눈다.

- `ui`: 렌더링과 feature 전용 컴포넌트
- `types`: 타입 계약
- `model`: 비즈니스 규칙과 상태 모델
- `hooks`: feature 전용 커스텀 훅
- `api`: BFF 통신
- `lib`: feature 내부 유틸리티

## Data Fetching
- API 통신은 BFF, Backend For Frontend, 기준으로 설계한다.
- 클라이언트에서 외부 백엔드 API를 직접 호출하지 않는다.
- 실시간 요구사항이 없으므로 기본 데이터 로딩은 SSR 또는 Server Component를 우선한다.
- polling, websocket, subscription은 기본 사용하지 않는다.
- 클라이언트 데이터 요청은 사용자 이벤트 이후 필요한 경우로 제한한다.
