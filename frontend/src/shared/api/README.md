# Shared API

BFF endpoint와 공용 API 기반 코드를 관리한다.

## 규칙
- 외부 백엔드 URL을 직접 노출하지 않는다.
- 클라이언트와 feature 코드는 BFF endpoint만 사용한다.
- BFF endpoint 경로는 `endpoints.ts`에서 관리한다.
- feature별 요청 함수는 각 feature의 `api`에 둔다.
- 인증, 토큰, 쿠키, 헤더 조합은 BFF 또는 서버 계층에서 처리한다.
