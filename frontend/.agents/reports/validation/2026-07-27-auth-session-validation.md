# 인증/BFF 세션 구조 및 자산 최적화 재검증

## 작업 일시
- 2026-07-27 17:25:52 KST

## 검증 대상
- 카카오 로그인 콜백 계약 변경
- auth refresh/logout BFF route
- `proxy.ts` 기반 세션 복구
- 로그아웃 UI 인터랙션 연결
- `ConfirmDialog`, `SideMenu` 공용 UI 변경
- PNG 자산의 WebP 전환

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- 로그인 콜백이 백엔드 계약 `POST /api/auth/kakao/token` + `{ code }`를 따르는지 확인했다.
- 로그아웃 UI가 feature `api`와 hook을 통해 BFF `/api/auth/logout`에 연결되는지 확인했다.
- refresh/logout/cookie/auth client가 BFF와 서버 계층으로 분리되어 있는지 확인했다.
- Next 16 규약에 맞게 `middleware`가 `proxy`로 이전되었는지 확인했다.
- PNG 참조가 WebP로 교체되었는지 확인했다. 단, `src/app/icon.png`는 Next 파일 규약 때문에 유지했다.
- `validation.md` 기준으로 BFF/SSR, VSA, 접근성, Storybook, 성능 검토 항목을 함께 확인했다.

## 변경 파일 요약
- `src/app/api/auth/kakao/callback/route.ts`: 카카오 code를 백엔드 auth API로 전달
- `src/app/api/auth/logout/route.ts`: 로그아웃 BFF route
- `src/app/api/auth/refresh/route.ts`: refresh BFF route
- `src/shared/api/server-auth*.ts`: 쿠키 처리와 외부 auth 백엔드 호출 책임 분리
- `src/proxy.ts`: 보호 경로(`/mypage`, `/saved`)에서만 refresh token 기반 세션 복구
- `src/features/auth/api/logout.ts`: feature 전용 BFF 호출
- `src/features/auth/hooks/useLogout.ts`: 로그아웃 오케스트레이션 훅
- `src/features/auth/ui/AccountMenu.tsx`: 확인 모달과 로그아웃 인터랙션 연결
- `src/shared/ui/dialog/ConfirmDialog.tsx`: 공용 확인 다이얼로그
- `src/shared/ui/layout/SideMenu.tsx`: 제어형 open/onOpenChange 지원
- `src/shared/ui/logo/**`, `src/shared/ui/illustration/**`, `src/widgets/auth/assets/**`, `src/widgets/home/assets/**`: WebP 자산 추가 및 참조 전환
- `src/shared/ui/stories/dialog/ConfirmDialog.stories.tsx`, `src/shared/ui/stories/layout/SideMenu.stories.tsx`: 공용 UI 계약 반영

## 실행한 검증 명령
- `npm run test:unit`
- `npm run lint`
- `npm run build`
- `npm run lint -- src/proxy.ts src/features/auth/test/server-auth.test.ts src/shared/ui/illustration/Illustration.tsx src/shared/ui/logo/LogoFull.tsx src/shared/ui/logo/LogoHorizontal.tsx src/shared/ui/logo/LogoSymbol.tsx src/types/assets.d.ts src/widgets/auth/LoginScreen.tsx src/widgets/home/HomeScreen.tsx`

## 구조/VSA 검토 결과
- `features/auth/api/logout.ts`는 BFF endpoint만 호출하며 외부 백엔드, 쿠키, 토큰을 직접 다루지 않는다.
- `features/auth/hooks/useLogout.ts`는 라우팅, pending/error 상태, BFF 호출을 훅으로 분리해 `ui` 파일의 세션 오케스트레이션 과밀을 막고 있다.
- `features/auth/ui/AccountMenu.tsx`는 드로어/모달 렌더링과 open state 조합 중심이며 세션 로직은 hook에 위임한다.
- `shared/api/server-auth-cookies.ts`, `shared/api/server-auth-client.ts` 분리는 BFF/서버 계층 책임을 명확히 한다.
- `shared/ui/dialog/ConfirmDialog.tsx`, `shared/ui/layout/SideMenu.tsx`는 공용 UI 계약 범위에 있고 stories도 함께 존재한다.
- 클라이언트 코드에서 외부 백엔드 직접 호출, 토큰/헤더 직접 조합은 발견되지 않았다.

## BFF/SSR 검토 결과
- feature `api`가 BFF endpoint 기준으로 작성되어 있다.
- 인증, 쿠키, Authorization 헤더 조합은 `shared/api/server-auth-*`와 `app/api/auth/**`에서만 처리한다.
- `proxy.ts`가 `/mypage`, `/saved` 보호 경로에서만 refresh token 기반 세션 복구를 수행한다.
- 전역 모든 요청에서 refresh를 시도하지 않으므로 이전 `middleware` 구조보다 초기 응답 경로의 auth 백엔드 호출 범위가 줄었다.

## 접근성/공용 UI 검토 결과
- `ConfirmDialog`는 `role="dialog"`, `aria-modal`, `aria-labelledby`, 선택적 `aria-describedby`, `Esc` 닫기, 포커스 순환을 제공한다.
- `SideMenu`는 `dialog` 역할, `Esc` 닫기, 포커스 순환, 트리거의 `aria-haspopup`/`aria-expanded`를 유지한다.
- `AccountMenu`의 로그아웃은 버튼 동작으로 처리되고, 내 정보 진입은 링크 성격의 `MenuItem`으로 분리되어 역할이 섞이지 않았다.
- 공용 UI 변경에 대해 Storybook story 파일이 존재해 계약 관리 기준을 충족한다.

## 성능 검토 결과
- `LCP`
  - unit test 실행 중 `logo-horizontal.webp`, `logo-full.webp`, `map-pin.webp`, `date-planning.webp`가 LCP 후보라는 Next 경고가 반복 출력됐다.
  - 포맷은 개선됐지만 above-the-fold 이미지의 `priority` 또는 `loading="eager"` 정책은 여전히 검토가 필요하다.
- `INP`
  - 새 인터랙션은 햄버거 메뉴 열기, 로그아웃 확인 모달 열기, 로그아웃 제출이다.
  - `useLogout`는 interaction logic를 event/hook 경계에 두고 있어 구조상 큰 INP 퇴행 신호는 없다.
- `CLS`
  - `ConfirmDialog`와 `SideMenu`는 portal/fixed overlay라 기존 레이아웃을 밀어내지 않는다.
  - 현재 코드만 보면 눈에 띄는 layout shift 위험은 낮다.
- `TTFB`
  - `proxy.ts`는 access token이 없고 refresh token이 남아 있을 때 보호 경로에서만 auth 백엔드 호출을 수행한다.
  - 전역 요청 대비 리스크는 줄었지만, `/mypage`, `/saved` 첫 진입에서는 여전히 TTFB 증가 가능성이 있다.
- `FCP`
  - 첫 화면에 새로 추가된 무거운 클라이언트 경계는 제한적이지만, `SideMenu`와 `ConfirmDialog`는 client component이므로 초기 JS 증가 영향은 소폭 존재한다.

## 품질 명령 결과
- `npm run test:unit`: 성공, `33 passed`, `91 passed`
- `npm run build`: 성공
- 변경 범위 한정 lint: 성공
- `npm run lint`: 실패
  - 실패 원인은 이번 변경 범위 밖의 `.claude/skills/**.cjs` 파일에서 `@typescript-eslint/no-require-imports` 위반 15건
  - 이번 auth/session/proxy/WebP 변경 범위 한정 lint는 통과

## 남은 리스크 및 후속 작업
- `src/app/icon.png`는 Next 파일 규약 때문에 이번 WebP 전환 대상에서 제외했다.
- 보호 경로에서 수행되는 refresh는 세션 복구에는 유리하지만 `/mypage`, `/saved` 첫 진입의 `TTFB`를 증가시킬 수 있다.
- LCP 이미지 경고는 여전히 남아 있으므로 above-the-fold 이미지의 `priority`/`loading="eager"` 검토가 필요하다.
- 저장소 전체 lint는 여전히 `.claude/skills/**` 기존 오류 때문에 green 상태가 아니다.
