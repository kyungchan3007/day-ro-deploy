# 인증/BFF 세션 구조 검증

## 작업 일시
- 2026-07-27 17:16:02 KST

## 검증 대상
- 카카오 로그인 콜백 계약 변경
- auth refresh/logout BFF route 추가
- middleware 기반 세션 복구
- 로그아웃 UI 인터랙션 연결
- ConfirmDialog, SideMenu 공용 UI 변경

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- 로그인 콜백이 백엔드 계약인 `POST /api/auth/kakao/token` + `{ code }` 구조를 따르는지 확인했다.
- auth refresh/logout 경계가 BFF 구조로 분리됐는지 확인했다.
- 로그아웃 UI 인터랙션이 feature `api`와 hook을 통해 연결됐는지 확인했다.
- access token 만료 후 refresh token 기반 세션 복구 경로가 존재하는지 확인했다.

## 변경 파일 요약
- `src/app/api/auth/kakao/callback/route.ts`: 카카오 code를 백엔드 auth API로 전달
- `src/app/api/auth/logout/route.ts`: 로그아웃 BFF route 추가
- `src/app/api/auth/refresh/route.ts`: refresh BFF route 추가
- `src/shared/api/server-auth*.ts`: 쿠키 처리와 외부 auth 백엔드 호출 책임 분리
- `src/middleware.ts`: access token 부재 시 refresh token으로 세션 복구
- `src/features/auth/api/logout.ts`: feature 전용 BFF 호출 추가
- `src/features/auth/hooks/useLogout.ts`: 로그아웃 오케스트레이션 훅 추가
- `src/features/auth/ui/AccountMenu.tsx`: 확인 모달과 로그아웃 인터랙션 연결
- `src/shared/ui/dialog/ConfirmDialog.tsx`: 공용 확인 다이얼로그 추가
- `src/shared/ui/layout/SideMenu.tsx`: 제어형 open/onOpenChange 지원 추가

## 실행한 검증 명령
- `npm run test:unit`
- `npm run lint`
- `npm run build`
- `npm run lint -- src/features/auth/ui/AccountMenu.tsx src/features/auth/hooks/useLogout.ts src/features/auth/api/logout.ts src/features/auth/test/logout.test.ts src/features/auth/test/server-auth.test.ts src/shared/api/endpoints.ts src/shared/api/openapi/dayro.openapi.ts src/shared/api/server-auth.ts src/shared/api/server-auth-client.ts src/shared/api/server-auth-cookies.ts src/app/api/auth/kakao/callback/route.ts src/app/api/auth/logout/route.ts src/app/api/auth/refresh/route.ts src/middleware.ts src/shared/ui/dialog/ConfirmDialog.tsx src/shared/ui/layout/SideMenu.tsx src/shared/ui/stories/dialog/ConfirmDialog.stories.tsx src/shared/ui/stories/layout/SideMenu.stories.tsx src/shared/static/auth/index.ts`

## 구조/VSA 검토 결과
- `features/auth/api/logout.ts`는 BFF endpoint만 호출하며 외부 백엔드나 토큰 조합을 다루지 않는다.
- `features/auth/hooks/useLogout.ts`는 라우팅, pending/error 상태, BFF 호출 오케스트레이션을 훅으로 분리해 `ui` 책임 과밀을 막고 있다.
- `features/auth/ui/AccountMenu.tsx`는 모달 open/close와 렌더링을 담당하고 세션 로직은 훅으로 위임해 역할 분리가 유지된다.
- `shared/api/server-auth-cookies.ts`, `shared/api/server-auth-client.ts` 분리는 BFF/서버 계층 책임을 분명하게 한다.
- `shared/ui`에 추가된 `ConfirmDialog`와 `SideMenu` 변경은 공용 UI 계약 범위 안에 있다.
- 클라이언트 코드에서 외부 백엔드 직접 호출은 발견되지 않았다.

## 품질 명령 결과
- `npm run test:unit`: 성공, `33 passed`, `91 passed`
- `npm run build`: 성공
- `npm run lint`: 실패
  - 실패 원인은 이번 변경 범위 밖의 `.claude/skills/**.cjs` 파일에서 `@typescript-eslint/no-require-imports` 위반 15건
  - 변경 범위 한정 lint는 통과

## 남은 리스크 및 후속 작업
- Next 16.2.9 빌드에서 `middleware` 파일 규약이 deprecated 라는 경고가 출력됐다. 추후 `proxy` 규약으로 이전 여부를 검토해야 한다.
- 전체 lint는 현재 워크트리의 기존 `.claude/skills/**` 오류 때문에 깨져 있어 저장소 전체 기준 green 상태는 아니다.
- unit test 실행 중 LCP 관련 `next/image` 경고가 있었지만 이번 auth/BFF 변경의 기능 검증 자체를 막지는 않았다.
