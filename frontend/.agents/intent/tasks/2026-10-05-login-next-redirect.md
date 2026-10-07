# 로그인 후 원래 화면(next) 복귀

## Task Meta
- task_id: 2026-10-05-login-next-redirect
- date: 2026-10-05
- owner: Claude(구현) / 독립 검증 세션(검증)
- status: approved(approve-with-notes) — 독립 검증 라운드 2
- task_type: 기능 구현(버그 수정)
- linked_prd: - (버그 수정, issue Dayro-dev/dayro#131)
- linked_sdd: `intent/sdd/2026-10-05-login-next-redirect.md`
- branch: `bug/#131-login-next-redirect`

## Acceptance Criteria
- must: `/login?next=<내부 경로>`로 들어와 카카오 로그인에 성공하면 그 경로(쿼리 포함, fragment 제외)로 이동해야 한다.
- must: next 가 없거나 무효(외부 URL, `//host`, `/\`, `/api/*`, `/login`, 제어 문자, 2048자 초과)면 `/`로 이동해야 한다.
- must: OAuth 왕복 동안 next 는 httpOnly 쿠키로만 보관되고, 콜백 처리 후(성공·실패 모두) 삭제되어야 한다.
- must: 로그인 실패·취소 후 로그인 화면으로 돌아와 다시 시도해도 next 가 유지되어야 한다.
- must not: 클라이언트 JS 에서 next 쿠키를 읽거나 쓰면 안 된다.
- should: 코스 지도 화면 저장 401 → 로그인 → 같은 코스 지도 화면 복귀(흐름 상태 복원).

## Evidence Plan
- unit: sanitize 규칙, start/callback 라우트 쿠키·redirect
- e2e(사용자 승인 범위): 기존 e2e 회귀

## Evidence Result
- 구현: Claude / 검증: 독립 검증 세션 — 라운드 1 reject(P1 dot-segment 오픈 리다이렉트 `/..//evil.com` → `//evil.com`, P2 테스트 공백) → 정규화 pathname `//` 거부·대소문자 무시 차단·재해석 origin 확인·인코딩 슬래시(`%2f`·`%5c`) 거부 → 라운드 2 approve-with-notes(30만 건 퍼징 off-site 0)
- lint 0 errors · tsc · build · 번들 예산 · auth 단위 77/77 · e2e 18/18(start 모드, 사용자 dev 서버 3000 점유)
- e2e: 카카오 도메인 전부 abort, start 응답 가로채 콜백으로 우회, 콜백 redirect 위치로 검증(e2e 서버 localhost/127.0.0.1 origin 차이). 1차 시도 때 redirect hop 미가로채기로 실제 accounts.kakao.com 페이지 접속(입력 없음) → 차단 추가
- e2e 인프라: 목 백엔드 `/api/auth/kakao/token` 추가, 생성마다 고유 requestId·requestId별 재추천 카운트(병렬 flaky 해소), course-new 소진 토스트 확인 시점 조정
- 보안 점검 이관: `/login?message=` 렌더(content spoofing), 콜백이 백엔드 예외 메시지를 URL에 실음, 프록시 뒤 Secure 판정
