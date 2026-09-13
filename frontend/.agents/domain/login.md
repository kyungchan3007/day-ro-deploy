# 도메인 온톨로지: Login

## Canonical Term
- `Login`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `auth` | code path | `src/features/auth`, `src/widgets/auth` |
| `login` | route label | `/login` |
| `카카오 로그인` | UI label | 현재 유일한 인증 시작 CTA |

## Domain Goal
- 사용자가 인증을 시작할 수 있는 명확한 로그인 진입 화면을 제공한다.
- OAuth, 세션, callback 세부 구현은 UI 도메인 밖에 두고 인증 시작 affordance 만 노출한다.

## 읽어야 하는 경우
- `src/app/login/**`, `src/widgets/auth/LoginScreen.tsx`, `src/features/auth/ui/KakaoLoginButton.tsx`, `src/shared/static/auth/**`를 수정할 때
- 로그인 화면 카피, 인증 CTA, 약관 링크, 로그인 후 복귀 흐름을 수정할 때
- 인증 시작/세션 관련 테스트를 추가할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/login` | Route | `src/app/login/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/login/**` |
| `widgets` | `src/widgets/auth/LoginScreen.tsx` |
| `features` | `src/features/auth/**` 중 로그인 관련 UI, model, api |
| `shared/static` | `src/shared/static/auth/**` 중 로그인 카피 |
| `shared/ui` | `Button`, `AppShell`, `NavBar` 등 로그인에서 재사용하는 공용 primitive |

## 사용자 플로우
1. 사용자가 `/login`에 진입한다.
2. 로그인 소개와 카카오 로그인 CTA, 약관/개인정보처리방침 링크를 본다.
3. 카카오 로그인 CTA를 통해 외부 인증 시작점으로 이동한다.

## Subflows
- 현재 모델링된 하위 흐름 없음

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `LoginIntro` | `title`, `subtitle` | `src/shared/static/auth` |
| `TermsLink` | `label`, `href` | `src/shared/static/auth` |
| `LoginButtonLabel` | string | `src/shared/static/auth` 또는 feature UI |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `RequestKakaoLogin` | 사용자가 카카오 버튼 클릭 | 외부 인증 시작 |
| `OpenServiceTerms` | 사용자가 이용약관 링크 클릭 | 이용약관 열기 |
| `OpenPrivacyPolicy` | 사용자가 개인정보 처리방침 링크 클릭 | 개인정보 처리방침 열기 |

## States

| State | 의미 |
| --- | --- |
| `LoginIdle` | 로그인 화면이 노출되고 사용자 입력을 기다리는 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| `LoginIdle` | `RequestKakaoLogin` | 외부 인증 시작 상태 | 외부 인증 구현이 소유 |
| `LoginIdle` | `OpenServiceTerms` | 정책 문서 보기 상태 | 외부 문서 열기 |
| `LoginIdle` | `OpenPrivacyPolicy` | 정책 문서 보기 상태 | 외부 문서 열기 |

## Invariants
- `Login` UI는 OAuth 프로토콜 세부 구현을 포함하면 안 된다.
- `KakaoLoginButton`은 부수효과를 외부에서 주입받는 UI artifact 로 유지되어야 한다.
- 약관 링크는 `Login`의 콘텐츠이며 인증 로직 자체가 아니다.
- 로그인 성공 후 세션 복구와 리다이렉트 정책은 UI 컴포넌트가 아니라 서버/BFF/인증 계층이 소유한다.

## UI 계약
- 카카오 로그인 CTA는 현재 유일한 인증 시작 수단이다.
- 약관/개인정보처리방침 링크는 명시적인 링크 역할을 가져야 한다.
- 인증 CTA는 기존 공용 버튼 또는 공용 스타일 primitive 재사용 가능 여부를 먼저 검토해야 한다.
- 로그인 화면은 보호 라우트의 대체가 아니라 인증 진입점이다.

## SSR / BFF / 데이터 규칙
- 로그인 화면은 정적 카피 중심으로 렌더할 수 있다.
- 세션 상태 판정은 로그인 화면 내부에서 클라이언트 fetch로 수행하지 않는다.
- OAuth 시작, callback, refresh, logout 같은 네트워크 계약은 BFF 또는 서버 계층이 소유한다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `LoginScreen` | UIArtifact | `src/widgets/auth/LoginScreen.tsx` |
| `KakaoLoginButton` | UIArtifact | `src/features/auth/ui/KakaoLoginButton.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `Login` route entry | `src/app/login/page.tsx` |
| `LoginScreen` 조합 | `src/widgets/auth/LoginScreen.tsx` |
| `KakaoLoginButton` public API | `src/features/auth/index.ts` |
| 로그인 정적 카피 | `src/shared/static/auth` |
| 로그인 API 계약 | `src/features/auth/api/**`, `src/features/auth/model/oauth.ts` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Login` | `hasRoute` | `/login` |
| `Login` | `renders` | `LoginScreen` |
| `LoginScreen` | `renders` | `KakaoLoginButton` |
| `Login` | `uses` | `src/shared/static/auth` |
| `RequestKakaoLogin` | `dependsOn` | 외부 인증 제공자 |
| `Login` | `dependsOn` | `MyPage` 보호 라우트 복귀 흐름 |

## Out Of Scope
- OAuth callback 처리
- 토큰 저장
- 세션 복구
- 로그인 완료 후 리다이렉트 정책

## 테스트 포인트
- 로그인 버튼이 인증 시작 endpoint 또는 핸들러를 유지하는지 확인한다.
- 약관/개인정보처리방침 링크 href 를 검증한다.
- 세션/인증 API 계약 테스트와 로그인 화면 표현 테스트를 분리한다.

## Validation Rules
- `LoginScreen`은 조합 아티팩트로 유지되어야 한다.
- 인증 부수효과는 `KakaoLoginButton` 바깥에서 주입되어야 한다.
- 인증 상태를 UI에서 직접 표현하기 시작하면 구현 전에 새로운 state와 transition을 먼저 모델링해야 한다.
