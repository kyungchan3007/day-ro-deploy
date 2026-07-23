# Shared UI Storybook 인벤토리

작업 일시: 2026-07-21

## 목적
- `src/shared/ui` 전체를 Storybook 이전 대상 관점으로 정리한다.
- story 파일은 `src/shared/ui/stories/**`에서 별도 관리한다.
- 각 컴포넌트를 `ready`, `needs-adapter`, `needs-refactor`, `non-story`로 구분한다.
- 추후 Storybook 도입 시 어떤 순서로 stories를 만들지 기준을 고정한다.

## 분류 기준

### `ready`
- props만으로 주요 상태를 재현할 수 있다.
- router, portal, 전역 브라우저 객체, 앱 컨텍스트 의존이 없다.
- story를 바로 만들 수 있다.

### `needs-adapter`
- 컴포넌트 자체는 공용 UI로 적절하다.
- 다만 `next/link`, `next/image`, portal, interactive wrapper, hook 시연 등 Storybook 환경 연결이 조금 필요하다.
- 큰 API 변경 없이 story 작성 가능하다.

### `needs-refactor`
- 공용 UI이긴 하지만 현재 API로는 story가 불편하거나 상태 재현이 불명확하다.
- story 전에 public props 또는 책임 경계를 먼저 다듬는 편이 낫다.

### `non-story`
- story 대상 컴포넌트가 아니라 유틸리티, 배럴 export, 내부 상수에 가깝다.
- 필요하면 MDX 문서나 icon gallery 형태로 다룬다.

## 결과 요약

### `ready`
- `src/shared/ui/auth/LogoutButton.tsx`
- `src/shared/ui/badge/PlaceNumberBadge.tsx`
- `src/shared/ui/button/Button.tsx`
- `src/shared/ui/card/PlaceCard.tsx`
- `src/shared/ui/course/CourseActions.tsx`
- `src/shared/ui/course/CourseTabGroup.tsx`
- `src/shared/ui/feedback/LoadingScreen.tsx`
- `src/shared/ui/layout/AppShell.tsx`
- `src/shared/ui/layout/Container.tsx`
- `src/shared/ui/logo/Logo.tsx`
- `src/shared/ui/motion/Floating.tsx`
- `src/shared/ui/progress/StepProgress.tsx`
- `src/shared/ui/route/PathRoute.tsx`
- `src/shared/ui/route/RouteSummary.tsx`
- `src/shared/ui/route/TransportInfo.tsx`
- `src/shared/ui/route/TransportLabel.tsx`
- `src/shared/ui/route/TransportStep.tsx`
- `src/shared/ui/toast/Toast.tsx`

### `needs-adapter`
- `src/shared/ui/auth/WithdrawButton.tsx`
- `src/shared/ui/button/BackButton.tsx`
- `src/shared/ui/dialog/ConfirmDialog.tsx`
- `src/shared/ui/illustration/Illustration.tsx`
- `src/shared/ui/layout/NavBar.tsx`
- `src/shared/ui/layout/SideMenu.tsx`
- `src/shared/ui/logo/LogoFull.tsx`
- `src/shared/ui/logo/LogoHorizontal.tsx`
- `src/shared/ui/logo/LogoSymbol.tsx`
- `src/shared/ui/menu/MenuItem.tsx`
- `src/shared/ui/toast/useToast.ts`

### `needs-refactor`
- 현재 없음

### `non-story`
- `src/shared/ui/auth/index.ts`
- `src/shared/ui/badge/index.ts`
- `src/shared/ui/button/index.ts`
- `src/shared/ui/card/index.ts`
- `src/shared/ui/course/index.ts`
- `src/shared/ui/dialog/index.ts`
- `src/shared/ui/feedback/index.ts`
- `src/shared/ui/icon/Icon.tsx`
- `src/shared/ui/icon/icons.tsx`
- `src/shared/ui/icon/index.ts`
- `src/shared/ui/illustration/index.ts`
- `src/shared/ui/index.ts`
- `src/shared/ui/layout/index.ts`
- `src/shared/ui/lib/cn.ts`
- `src/shared/ui/lib/index.ts`
- `src/shared/ui/lib/useControllableState.ts`
- `src/shared/ui/logo/index.ts`
- `src/shared/ui/menu/index.ts`
- `src/shared/ui/motion/index.ts`
- `src/shared/ui/progress/index.ts`
- `src/shared/ui/route/constants.tsx`
- `src/shared/ui/route/index.ts`
- `src/shared/ui/toast/index.ts`

## 컴포넌트별 메모

### auth
- `LogoutButton`: story 바로 가능. 기본 상태 하나와 hover/disabled 정도면 충분하다.
- `WithdrawButton`: `href` 기반 Link 렌더와 `button` 렌더를 둘 다 보여줘야 한다. Next.js Storybook framework 또는 Link adapter가 필요하다.

### button
- `Button`: variant, size, fullWidth, icon 조합을 story args로 정리하기 좋다.
- `BackButton`: `href`와 `onClick` 두 계약을 모두 보여줘야 한다. Link 처리만 되면 바로 가능하다.

### badge
- `PlaceNumberBadge`: variant, size, value 경계값만 정리하면 된다.

### card
- `PlaceCard`: 가장 먼저 올리기 좋은 카드다. collapsed, expanded, custom body, moveInfo 유무를 story로 나누면 된다.

### course
- `CourseActions`: save/reroll 라벨 변형과 기본 조합 정도면 충분하다.
- `CourseTabGroup`: controlled, uncontrolled, disabled option 상태를 story로 표현하기 좋다.

### dialog
- `ConfirmDialog`: portal과 open 상태 시연이 필요하다. Storybook에서는 render 함수나 wrapper state로 여는 예제가 필요하다.

### feedback
- `LoadingScreen`: illustration 유무, middle slot 유무, 긴 메시지 상태를 story로 만들면 된다.

### illustration
- `Illustration`: `next/image` 대응이 필요하다. asset 기반이라 Storybook Next.js preset이 있으면 바로 가능하다.

### layout
- `AppShell`: nav, footer, bleed 조합을 story로 문서화하기 좋다.
- `Container`: section/main 태그 변형과 폭 정렬 기준을 간단히 보여주면 된다.
- `NavBar`: 기본 로고형, back hidden, right action 포함 상태를 보여주면 된다. `BackButton`, `LogoHorizontal` 의존으로 Next adapter가 필요하다.
- `SideMenu`: portal, open state, focus 이동 때문에 interactive story가 필요하다.

### logo
- `Logo`: pure component라 바로 가능하다.
- `LogoFull`, `LogoHorizontal`, `LogoSymbol`: `next/image` 대응만 있으면 story 가능하다.

### menu
- `MenuItem`: link/action 두 가지 렌더 계약이 핵심이다. Link adapter 필요.

### motion
- `Floating`: 단독 story보다는 다른 컴포넌트 예제에서 쓰이기 쉽다. 그래도 motion utility 자체를 한 개 story로 두는 건 유효하다.

### progress
- `StepProgress`: `1/3`, `2/3`, `3/3`, 큰 total 값 정도만 정리하면 된다.

### route
- `PathRoute`: orientation, variant, thickness 조합을 story args로 보여주기 좋다.
- `RouteSummary`: label, value, unit 조합만 있으면 된다.
- `TransportInfo`: mode별 표현 차이를 한 파일에서 전시하기 좋다.
- `TransportLabel`: transport chip gallery 형태로 만들면 된다.
- `TransportStep`, `TransportStepList`: 단일 스텝과 시퀀스 둘 다 story 가치가 높다.

### toast
- `Toast`: success, info 두 상태면 충분하다.
- `useToast`: hook 단독보다는 demo story로 보여줘야 한다. `ToastDemo` 같은 story-only wrapper가 필요하다.

## 추천 story 작성 순서

### 1차
- `Button`
- `BackButton`
- `PlaceNumberBadge`
- `StepProgress`
- `RouteSummary`
- `TransportLabel`
- `TransportInfo`
- `TransportStep`

### 2차
- `LogoutButton`
- `WithdrawButton`
- `MenuItem`
- `CourseActions`
- `CourseTabGroup`
- `Toast`

### 3차
- `PlaceCard`
- `NavBar`
- `AppShell`
- `Container`
- `LoadingScreen`
- `Logo`
- `LogoFull`
- `LogoHorizontal`
- `LogoSymbol`
- `Illustration`

### 4차
- `ConfirmDialog`
- `SideMenu`
- `useToast` demo

## Storybook 설정 시 필요한 최소 어댑터
- Next.js App Router 기반 Storybook preset
- `next/link` 렌더 지원
- `next/image` 렌더 지원
- portal 기반 interactive story 실행 환경
- 필요 시 전역 CSS와 디자인 토큰 로딩

## 바로 다음 작업
1. Storybook 설정 파일이 들어오면 `ready` 목록부터 `.stories.tsx`를 만든다.
2. `needs-adapter` 항목은 공용 preview 설정과 render wrapper를 먼저 만든다.
3. `useToast`처럼 훅 성격인 항목은 컴포넌트 story가 아니라 demo story로 처리한다.
