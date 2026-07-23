# Shared

둘 이상의 feature에서 실제로 재사용되는 공용 코드를 둔다.

## 허용 대상
- 공용 UI primitive
- 공용 유틸리티
- 공용 설정
- 공용 타입
- 공용 API client 기반 코드
- BFF endpoint 경로 관리

## 금지 대상
- 특정 feature 전용 비즈니스 로직
- 특정 도메인 흐름에만 쓰이는 helper
- feature 내부 구현을 아는 코드

## 규칙
- `shared`는 feature를 import하지 않는다.
- 재사용 근거 없이 코드를 먼저 shared로 빼지 않는다.
- shared 코드는 작고 안정적인 public API를 가진다.
- BFF endpoint는 `src/shared/api/endpoints.ts`에서 관리한다.
- feature별 요청 함수는 `shared`가 아니라 각 feature의 `api`에 둔다.
