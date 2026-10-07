# 코스 생성·재추천 로그인 토큰 전달 SDD

## Meta
- sdd_id: 2026-10-05-situation-auth-header
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시)
- status: approved(design) — 기존 BFF 경계 안의 소규모 변경
- issue: Dayro-dev/dayro#135
- linked_prd: `intent/prd/2026-10-05-situation-auth-header.md`

## 백엔드 확인(코드 기준)
- `SecurityConfig`: `/api/situations/**` permitAll.
- `JwtAuthenticationFilter`: 토큰이 있고 `validateToken`이 true 일 때만 인증 설정. `validateToken`은 서명 오류·만료·파싱 예외를 모두 false 로 반환 → 만료 토큰도 401 없이 비회원 처리.
- 참고: develop 기준 situation 컨트롤러는 아직 `@AuthenticationPrincipal`을 읽지 않는다(집계 쪽 변경은 백엔드 담당). 헤더가 먼저 들어가도 동작 영향 없음.

## Design Decisions
- 토큰 출처: Route Handler 가 `readAccessTokenCookie(request)`(httpOnly 쿠키)로 읽는다. 클라이언트 JS 는 토큰을 다루지 않는다(bff.md).
- 전달: `submitSituation(request, { accessToken })`, `retrySituation(requestId, { accessToken })` → backend transport 가 `withOptionalBearer`로 토큰이 있을 때만 `Authorization: Bearer` 추가. 코스 저장 BFF(`server-course-client.ts`)와 같은 헤더 형식.
- transport 는 쿠키를 직접 읽지 않는다(호출부가 토큰 주입) — 서버 계층·transport 의 기존 역할 유지.
- refresh 하지 않는다: 비로그인 허용 API 라 만료 시 비회원으로 처리되는 것이 의도된 동작.

## Risks
- 토큰 로그 노출: 헤더만 추가, 로그·에러 메시지에 토큰을 싣지 않음.
