# 로그인 후 원래 화면(next) 복귀 SDD

## Meta
- sdd_id: 2026-10-05-login-next-redirect
- date: 2026-10-05
- owner: Claude(구현, 사용자 지시) / 독립 검증 세션(검증)
- status: approved(design) — 기존 OAuth 경계 안의 버그 수정(구조 변경 없음)
- issue: Dayro-dev/dayro#131

## Scope Path
- affected routes: `/login`, `/api/auth/kakao/start`, `/api/auth/kakao/callback`
- affected slices: `features/auth/model/oauth.ts`, `shared/api/server-auth-cookies.ts`·`server-auth.ts`, `widgets/auth/LoginScreen.tsx`, `app/login/page.tsx`
- related guides: bff.md(인증·쿠키는 서버 계층), server-client-boundary.md, accessibility.md(숨김 입력)
- related domains: login.md

## 현재 결함
- `next`를 보내는 곳: `proxy.ts`(보호 경로), `app/mypage/page.tsx`, `features/saved/server/require-saved-auth.ts`, `useSavedCourseDetailScreen`, `useCourseMapScreen`(저장 401)
- `app/login/page.tsx`가 `next`를 읽지 않고, 로그인 폼(GET `/api/auth/kakao/start`)에 전달되지 않으며, 콜백은 성공 시 항상 `/`.

## Design Decisions
- 검증(순수, `features/auth/model/oauth.ts` `sanitizeLoginNextPath`): 문자열·2048자 이하·`/`로 시작·`//`·`/\`로 시작 금지·제어 문자 금지 → 상대 URL 파싱 결과가 같은 origin 이고 pathname 이 `/api/`·`/login`이 아닐 때만 `pathname + search` 반환(fragment 제거). 실패 시 null.
- 전달: `/login?next=` → 서버 page 가 검증 → `LoginScreen`이 폼에 `<input type="hidden" name="next">` → start 라우트가 재검증 후 httpOnly 쿠키 `dayro_oauth_next`(SameSite=Lax, Secure=HTTPS, Path=/, Max-Age=OAuth state 와 동일 10분)에 보관.
- 복귀: callback 성공 시 쿠키 값을 다시 검증해 redirect(없거나 무효면 `/`), 쿠키 삭제. 실패·취소 시 `/login?error=...&next=<검증된 값>`으로 돌려 재시도에도 유지, 쿠키 삭제.
- 클라이언트 JS 는 next 쿠키를 다루지 않는다(bff.md). 쿠키 helper 는 `shared/api/server-auth-cookies.ts`.
- #125 연계: `/login`은 Meta 미실행, GA `page_location`은 허용 목록 외 쿼리(next) 제거 — 변경 없음.

## Risks
- 오픈 리다이렉트: 검증을 page·start·callback 세 지점에서 동일 함수로 수행.
- 코스 지도 복귀는 #129 흐름 상태(같은 탭 sessionStorage)에 의존 — 카카오 왕복은 같은 탭이라 복원됨.
