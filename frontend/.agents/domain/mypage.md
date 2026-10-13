# 도메인 온톨로지: MyPage

## Canonical Term
- `MyPage`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `mypage` | route | `/mypage` |
| `profile` | code path | `src/features/profile`, `src/widgets/profile`, `src/shared/static/profile` |
| `내 정보` | UI label | 마이페이지 본문과 상단 타이틀 |

## Domain Goal
- 로그인한 사용자가 자신의 기본 정보를 확인할 수 있는 보호된 내 정보 화면을 제공한다.
- 인증 세션 해석은 서버 경계에 두고, 화면은 읽기 전용 정보 표시와 회원탈퇴 진입만 소유한다.

## 읽어야 하는 경우
- `src/app/mypage/page.tsx`, `src/widgets/profile/**`, `src/features/profile/**`, `src/shared/static/profile/**`를 수정할 때
- 프로필 표시 항목, 보호 라우트 진입, 로그인 리다이렉트, 회원탈퇴 진입 CTA를 수정할 때
- 인증된 사용자 표시와 관련된 테스트를 추가할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/mypage` | Route | `src/app/mypage/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/mypage/page.tsx` |
| `widgets` | `src/widgets/profile/**` |
| `features` | `src/features/profile/**` |
| `shared/static` | `src/shared/static/profile/**` |
| `shared/ui` | `AppShell`, `NavBar`, `WithdrawButton` |

## 사용자 플로우
1. 인증된 사용자가 `/mypage`에 진입한다.
2. 서버가 세션을 확인하고, 비인증이면 `/login?next=%2Fmypage`로 리다이렉트한다.
3. 인증된 경우 프로필 정보와 회원탈퇴 진입 CTA를 렌더한다.

## Subflows

| Subflow | 목적 | Owner |
| --- | --- | --- |
| `MyInfoView` | 내 정보 표시와 회원탈퇴 진입 CTA 렌더 | `src/widgets/profile/MyInfoScreen.tsx`, `src/features/profile/ui/ProfileInfoList.tsx` |

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `SessionUser` | 인증된 현재 사용자 정보 집합 | `src/features/auth` |
| `ProfileInfoRow` | `label`, `value` | `src/features/profile/ui/ProfileInfoList.tsx` |
| `ProfileInfoRows` | `ProfileInfoRow[]` | `src/features/profile/model/profile-info.ts` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `OpenMyPage` | 사용자가 내 정보 화면 진입 | 세션 확인 후 화면 렌더 또는 로그인 리다이렉트 |
| `ResolveSessionUser` | 서버가 현재 세션 조회 | `SessionUser` 준비 |
| `RedirectUnauthenticatedMyPage` | 비로그인 상태 진입 | `/login?next=%2Fmypage` 이동 |
| `OpenWithdrawFlowFromMyPage` | 사용자가 회원탈퇴 CTA 클릭 | `Withdraw` 도메인 진입 |

## States

| State | 의미 |
| --- | --- |
| `MyPageGuardPending` | 서버가 세션을 해석하는 상태 |
| `MyPageReady` | 인증된 사용자 정보가 렌더된 상태 |
| `MyPageRedirectedToLogin` | 비인증으로 로그인 페이지로 리다이렉트된 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| 외부 진입 | `OpenMyPage` + `ResolveSessionUser` | `MyPageReady` | 인증된 사용자일 때 |
| 외부 진입 | `OpenMyPage` + `RedirectUnauthenticatedMyPage` | `MyPageRedirectedToLogin` | 인증되지 않았을 때 |
| `MyPageReady` | `OpenWithdrawFlowFromMyPage` | 외부 `Withdraw` 상태 | `/mypage/withdraw`로 이동 |

## Invariants
- `MyPage`는 보호 라우트다. 인증되지 않은 사용자는 본문을 볼 수 없다.
- 세션 확인과 리다이렉트 정책은 서버 진입점이 소유한다.
- `MyInfoScreen`은 표시 조합만 담당하고 세션 fetch, 토큰, 쿠키 조합을 직접 소유하면 안 된다.
- 프로필 정보 행은 `buildProfileInfoRows`가 준비한 읽기 전용 view-model을 사용해야 한다.
- `WithdrawButton`은 탈퇴 실행이 아니라 탈퇴 흐름 진입만 소유한다.

## UI 계약
- 상단에는 `내 정보` 타이틀이 보여야 한다.
- 사용자 아바타 이니셜과 표시 이름이 함께 렌더되어야 한다.
- 프로필 정보는 label/value 목록 형태로 렌더되어야 한다.
- 하단 회원탈퇴 CTA는 공용 `WithdrawButton`을 우선 사용한다.

## SSR / BFF / 데이터 규칙
- 현재 사용자 정보는 초기 렌더에 필요하므로 서버에서 준비한다.
- `/mypage`는 Server Component에서 세션을 먼저 해석한다.
- 클라이언트에서 세션 재조회로 보호 라우트 여부를 판정하지 않는다.
- 쿠키, 세션, 리다이렉트 조합은 UI 계층으로 내려오면 안 된다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `MyInfoScreen` | UIArtifact | `src/widgets/profile/MyInfoScreen.tsx` |
| `ProfileInfoList` | UIArtifact | `src/features/profile/ui/ProfileInfoList.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `MyPage` route entry | `src/app/mypage/page.tsx` |
| 세션 기반 진입 가드 | `src/app/mypage/page.tsx` |
| 프로필 행 view-model | `src/features/profile/model/profile-info.ts` |
| `MyInfoView` 조합 | `src/widgets/profile/MyInfoScreen.tsx` |
| 프로필 정적 카피 | `src/shared/static/profile/index.ts` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `MyPage` | `hasRoute` | `/mypage` |
| `MyPage` | `hasSubflow` | `MyInfoView` |
| `MyInfoView` | `renders` | `MyInfoScreen` |
| `MyInfoScreen` | `renders` | `ProfileInfoList` |
| `MyPage` | `dependsOn` | `Login` |
| `OpenWithdrawFlowFromMyPage` | `dependsOn` | `Withdraw` |

## Out Of Scope
- 프로필 수정
- 회원 정보 저장 API
- 로그아웃 실행
- 회원탈퇴 실제 처리

## 테스트 포인트
- 서버 세션이 없을 때 `/login?next=%2Fmypage`로 리다이렉트되는지 확인한다.
- 프로필 행 변환 단위 테스트에서 null 값 숨김, 생일/가입일 포맷을 확인한다.
- 회원탈퇴 CTA가 `/mypage/withdraw` 진입 링크로 유지되는지 확인한다.

## Validation Rules
- `/mypage`의 인증 가드는 클라이언트 훅이 아니라 서버 진입점에 있어야 한다.
- `MyInfoScreen`에서 세션 로직, 쿠키 접근, fetch를 직접 추가하면 구조 위반 후보로 본다.
- 프로필 표시 항목이 늘어나면 `buildProfileInfoRows`와 이 문서의 value object / invariant를 함께 갱신해야 한다.
- 내 정보 화면에서 공용 `NavBar`, `AppShell`, `WithdrawButton` 재사용 가능 여부를 먼저 검토해야 한다.
