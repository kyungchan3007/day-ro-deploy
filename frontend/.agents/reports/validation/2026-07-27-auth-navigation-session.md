# 우측 네비게이션/내 정보 세션 연동 검증

## 작업 일시
- 2026-07-27 18:00 KST

## 검증 대상
- 로그인 상태에 따라 우측 네비게이션 메뉴를 분기하는 변경
- `/mypage` 내 정보 화면의 placeholder 제거와 실제 카카오 회원 정보 연동
- `GET /api/auth/me` BFF 추가
- 백엔드 현재 사용자 조회 API 추가

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- 로그인 상태면 우측 메뉴 상단의 `게스트님` 대신 실제 로그인 사용자 이름이 보이도록 구현됐다.
- 로그인 상태면 우측 메뉴에 `내 정보`와 `로그아웃`이 보이도록 구현됐다.
- 비로그인 상태면 기존 `게스트님`을 유지하고 `내 정보`를 숨기며 `로그인` 링크를 노출하도록 구현됐다.
- `/mypage`는 placeholder 값 대신 실제 카카오 연동 회원 정보(닉네임, 이메일, 이름, 생일, 가입일)를 가능한 범위에서 보여주도록 구현됐다.
- 카카오 동의 범위상 없는 값은 UI에 불필요하게 노출하지 않도록 행을 조건부 구성했다.

## 변경 파일 요약
- 백엔드
  - `../backend/dayro-backend/src/main/java/com/dayro/auth/controller/AuthController.java`: `GET /api/auth/me` 추가
  - `../backend/dayro-backend/src/main/java/com/dayro/auth/service/AuthService.java`
  - `../backend/dayro-backend/src/main/java/com/dayro/auth/service/impl/AuthServiceImpl.java`
  - `../backend/dayro-backend/src/main/java/com/dayro/auth/dto/response/CurrentMemberResponse.java`
- 프론트 BFF/서버 계층
  - `src/app/api/auth/me/route.ts`
  - `src/shared/api/server-auth-session.ts`
  - `src/shared/api/server-auth-client.ts`
  - `src/shared/api/endpoints.ts`
  - `src/shared/api/openapi/dayro.openapi.ts`
- 프론트 기능/UI
  - `src/features/auth/api/session.ts`
  - `src/features/auth/hooks/useAuthSession.ts`
  - `src/features/auth/lib/session-user.ts`
  - `src/features/auth/model/session.ts`
  - `src/features/auth/ui/AccountMenu.tsx`
  - `src/features/profile/model/profile-info.ts`
  - `src/widgets/profile/MyInfoScreen.tsx`
  - `src/app/mypage/page.tsx`

## 실행한 검증 명령
- `npm run test:unit -- src/features/auth/test/server-auth.test.ts src/features/auth/test/api-contract.test.ts`
- `npm run lint -- src/app/api/auth/me/route.ts src/shared/api/server-auth-session.ts src/shared/api/server-auth-client.ts src/shared/api/openapi/dayro.openapi.ts src/features/auth/ui/AccountMenu.tsx src/features/auth/hooks/useAuthSession.ts src/features/auth/api/session.ts src/features/auth/lib/session-user.ts src/features/profile/model/profile-info.ts src/widgets/profile/MyInfoScreen.tsx src/app/mypage/page.tsx src/features/auth/test/server-auth.test.ts src/features/auth/test/api-contract.test.ts`
- `npm run build`
- `./gradlew compileJava`

## 구조/VSA 검토 결과
- `features/auth/api/session.ts`는 BFF `/api/auth/me`만 호출하며 외부 백엔드, 토큰, 쿠키를 직접 알지 않는다.
- 세션 해석과 refresh 복구는 `src/shared/api/server-auth-session.ts`로 분리되어 `AccountMenu` UI 파일에 인증 오케스트레이션이 섞이지 않았다.
- `AccountMenu.tsx`는 메뉴 렌더링과 로그아웃 확인 모달만 담당하고, 로그인 상태 조회와 로그아웃 실행은 hook/api 계층에 위임한다.
- `/mypage`는 page에서 서버 세션을 읽고, widget은 받은 사용자 정보를 렌더링만 하므로 SSR 준비 책임과 화면 조합 책임이 분리돼 있다.
- profile 행 조립 규칙은 `features/profile/model/profile-info.ts`로 분리되어 widget/ui 파일에 표시 규칙이 과밀하지 않다.

## BFF/SSR 검토 결과
- 클라이언트는 외부 백엔드 API를 직접 호출하지 않는다.
- 새 `GET /api/auth/me` BFF는 access token 검증, 필요 시 refresh, 쿠키 재기록까지 서버 계층에서 처리한다.
- 홈 우측 메뉴는 비보호 라우트에서도 로그인 상태를 회복할 수 있도록 클라이언트에서 BFF를 호출한다.
- `/mypage`는 보호 라우트이므로 `proxy.ts`가 선행 복구를 담당하고, page는 서버에서 현재 사용자만 조회한다.

## 접근성/공용 UI 검토 결과
- 메뉴 이동은 `MenuItem href` 링크로, 로그아웃은 버튼으로 유지돼 링크/버튼 역할이 섞이지 않았다.
- 비로그인 상태에서 `내 정보`를 DOM에서 제거하고 `로그인` 링크를 노출해 불필요한 포커스 이동 대상이 남지 않는다.
- 기존 `SideMenu`, `ConfirmDialog`의 `dialog`, `aria-modal`, `Esc` 닫기, 포커스 순환 계약은 유지됐다.

## 성능 검토 결과
- `LCP`
  - 이번 변경은 홈의 above-the-fold 이미지 자체는 건드리지 않았다.
  - 메뉴 안 사용자명은 드로어 내부 콘텐츠라 LCP 직접 영향은 낮다.
- `INP`
  - 새 클라이언트 상호작용은 메뉴가 열렸을 때 세션 결과를 반영하는 정도이며, 무거운 동기 계산은 없다.
  - 로그아웃/로그인 버튼 분기는 기존 드로어 인터랙션 범위를 넘지 않는다.
- `CLS`
  - 메뉴 프로필 이름 변경은 고정 영역 내부 텍스트 교체라 큰 layout shift 위험은 낮다.
  - `/mypage` 프로필 정보는 SSR로 준비돼 hydration 이후 행이 뒤늦게 밀려 들어오는 구조가 아니다.
- `TTFB`
  - `/mypage`는 여전히 보호 경로에서 `proxy.ts` refresh가 발생할 수 있어 만료 시 TTFB 증가 리스크가 있다.
  - 홈(`/`)은 SSR에서 세션 조회를 하지 않고 클라이언트 BFF 조회로 분리해 초기 응답 지연을 늘리지 않았다.
- `FCP`
  - `useAuthSession`은 `AccountMenu` 클라이언트 경계 안에서만 동작하므로 페이지 전체 FCP 영향은 제한적이다.

## 품질 명령 결과
- `npm run test:unit -- src/features/auth/test/server-auth.test.ts src/features/auth/test/api-contract.test.ts`: 성공, `2 files`, `13 tests` 통과
- 대상 파일 lint: 성공
- `npm run build`: 성공
- `./gradlew compileJava`: 성공

## 남은 리스크 및 후속 작업
- 홈 우측 메뉴는 클라이언트에서 `/api/auth/me`를 한 번 호출하므로, 매우 느린 네트워크에서는 드로어를 즉시 열었을 때 짧게 `게스트님`이 보였다가 실제 이름으로 바뀔 수 있다.
- 백엔드 현재 사용자 응답은 카카오 동의 범위에 따라 `email`, `name`, `birthday`가 null 일 수 있으므로 QA에서 실제 카카오 계정별 표시 차이를 확인할 필요가 있다.
- 저장소 전체 lint 상태는 이번 변경 범위 밖의 기존 `.claude/skills/**.cjs` 오류와 별도로 관리해야 한다.
