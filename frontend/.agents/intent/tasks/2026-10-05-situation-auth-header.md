# 코스 생성·재추천 로그인 토큰 전달

## Task Meta
- task_id: 2026-10-05-situation-auth-header
- date: 2026-10-05
- owner: Claude(구현)
- status: done
- task_type: 기능 구현(BFF)
- linked_prd: `intent/prd/2026-10-05-situation-auth-header.md`
- linked_sdd: `intent/sdd/2026-10-05-situation-auth-header.md`
- branch: `feat/#135-situation-auth-header`

## Acceptance Criteria
- must: 로그인 상태(access token 쿠키 있음)면 코스 생성·재추천 백엔드 호출에 `Authorization: Bearer {token}`이 붙는다.
- must: 비로그인이면 Authorization 헤더가 없다.
- must: 응답 형식·화면 동작·에러 매핑이 바뀌지 않는다.
- must not: 클라이언트 JS 에서 토큰을 읽거나, 토큰을 로그·응답에 싣지 않는다.

## Evidence Plan
- unit: transport 헤더 유무(`server-situation.test.ts`), Route Handler 가 쿠키 토큰을 넘기는지(`app/api/situations/situations-auth.test.ts`)
- 회귀: 기존 situation·BFF 에러 매핑 테스트, lint·tsc·build·번들 예산

## Evidence Result
- unit: 헤더 유무 1건(`server-situation.test.ts`), Route Handler 토큰 전달 3건(`situations-auth.test.ts`) 통과
- lint 0 errors · tsc · build · 전체 unit 704 통과(기존 flaky `contact-form.test.tsx` 2건, 단독 통과)
- 번들 예산 변화 없음(서버 전용 변경): `/` 631,987B, `/course/new` 675,823B
- e2e: 이번 작업에선 미실행(서버 BFF 헤더만 변경, 사용자 지시 시 실행)
