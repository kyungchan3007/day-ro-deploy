# 운영(Workers)에서 로그인 복귀 next 의 &rev 가 잘려 상황입력 1단계로 이동

## Task Meta
- task_id: 2026-10-13-next-param-workers
- date: 2026-10-13
- owner: Claude(구현, 사용자 지시)
- status: review
- task_type: 버그 수정 (운영 환경 한정)
- linked_prd: - (소규모 수정, issue Dayro-dev/dayro#200)
- linked_sdd: - (구조 변경 없음, shared/lib 도우미 + auth Route Handler 2곳)
- branch: `fix/#200-next-param-workers`

## 문제 (사용자 스모크 테스트)
- 운영(day-ro.com)에서 상황입력 2 · 3단계 로그아웃 → 다시 로그인 → 1단계 이동, 로컬 3000 은 정상

## 원인 (직접 요청으로 확인)
- Cloudflare Workers(OpenNext) Route Handler 가 쿼리의 `%26`(&) 을 미리 풀어 `next` 의 `&rev=…` 가 별도 파라미터로 분리
  - 운영 `/api/auth/kakao/start?next=/course/new/?step=purpose%26rev%3Dtest1234` → 복귀 쿠키 `/course/new/?step=purpose`
  - 로컬(next dev) 은 전체 유지 → e2e · 로컬에서 드러나지 않음
- `rev` 없는 주소로 복귀 → 흐름 스냅샷을 못 찾아 1단계 리다이렉트
- 같은 원인: `/api/auth/restore?next=` (`/saved/abc?x=1&y=2` → `?x=1`)
- 페이지(`/login?next=`) 의 searchParams 는 운영에서도 정상 (Route Handler 만 해당)

## 결정
- `shared/lib/next-path-param.ts`: Route Handler 로 넘기는 next 를 base64url(UTF-8) 로 감싸고 되돌림
  - `/` 시작 값은 이전 평문으로 수용 (배포 중 혼재 대비)
  - 형식 오류 · 길이 초과 · 깨진 UTF-8 → null, 되돌린 값은 기존 `sanitizeLoginNextPath` 재검증
- 적용: 로그인 화면 폼 hidden next · `kakao/start` · `buildSessionRestorePath` · `restore` 핸들러
- 콜백 · 복귀 쿠키 · 로그인 화면 주소(`/login?next=`)는 그대로

## Acceptance Criteria
- must: 운영과 같은 Workers 런타임에서 `&rev` 포함 next 가 복귀 쿠키에 전체 저장
- must: base64url 로 감싼 외부 주소도 거부 (open redirect 방어 유지)
- must: 이전 평문 next 도 동작

## Evidence Result
- unit (storybook 제외) 75 files · 812 passed
  - 신규 `shared/lib/next-path-param.test.ts` 10건 (Workers 식 이중 디코딩 포함)
  - `login-next.test.ts` base64url next 전체 보관 · 인코딩된 외부 주소 거부, `server-auth.test.ts` restore & 쿼리 유지
  - `session-restore-guard.test.ts` 복구 경로 기대값 base64url 로 갱신
- tsc · eslint 0 errors
- Workers 런타임 재현 (OpenNext 빌드 + `wrangler dev` 127.0.0.1:8799, 가짜 카카오 키, 확인 후 종료)
  - 평문 next → 쿠키 `/course/new/?step=purpose` (운영 버그 재현)
  - base64url next → 쿠키 `/course/new/?step=purpose&rev=test1234` (해결)
  - 로그인 화면 폼 hidden next = base64url 값
- e2e: 기존 auth · 로그인 복귀 시나리오는 CI 에서 실행 (next dev 환경은 원래 잘리지 않아 이 버그 자체는 재현 불가)
