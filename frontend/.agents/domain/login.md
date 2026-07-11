# 도메인 온톨로지: Login

## Canonical Term
- `Login`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `auth` | code path | `src/features/auth`, `src/widgets/auth` |
| `login` | route label | `/login` |

## Domain Goal
- 사용자가 인증을 시작할 수 있는 명확한 로그인 진입 화면을 제공한다.
- OAuth/session 구현을 UI 도메인 안에 넣지 않고 인증 action 진입점만 노출한다.

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/login` | Route | `src/app/login/page.tsx` |

## Subflows
- 현재 모델링된 하위 흐름 없음

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | 설명 |
| --- | --- | --- |
| `LoginIntro` | `title`, `subtitle` | 로그인 소개 정적 카피 |
| `TermsLink` | `label`, `href` | 약관/정책 링크 객체 |
| `LoginButtonLabel` | string | UI 버튼에 전달되는 로그인 제공자 라벨 |

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
- `KakaoLoginButton`은 부수효과를 외부에서 주입받는 UIArtifact로 유지되어야 한다.
- 약관 링크는 `Login`의 콘텐츠이며 인증 로직 자체가 아니다.

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
| `Login` 정적 카피 | `src/shared/static/auth` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Login` | `hasRoute` | `/login` |
| `Login` | `renders` | `LoginScreen` |
| `LoginScreen` | `renders` | `KakaoLoginButton` |
| `Login` | `uses` | `shared/static/auth` |
| `RequestKakaoLogin` | `dependsOn` | 외부 인증 제공자 |

## Out Of Scope
- OAuth callback 처리
- 토큰 저장
- 세션 복구
- 로그인 완료 후 리다이렉트 정책

## Validation Rules
- `LoginScreen`은 조합 아티팩트로 유지되어야 한다.
- 인증 부수효과는 `KakaoLoginButton` 바깥에서 주입되어야 한다.
- 인증 상태를 UI에서 직접 표현하기 시작하면, 구현 전에 새로운 state와 transition을 먼저 모델링해야 한다.
