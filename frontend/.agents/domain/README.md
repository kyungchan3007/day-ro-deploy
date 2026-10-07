# Domain Index

이 디렉터리는 Dayro 프론트엔드의 도메인 온톨로지를 기록한다.

## 목적
- canonical term 통일
- alias 관리
- domain/subflow/entity/value object/action/state/transition 구조 정의
- 구현 소유권과 도메인 소유권 분리
- 검증 가능한 invariant 기록

## 문서 구성
- `common.md`: 공통 메타-온톨로지, 관계 타입, 구조 제약
- `home.md`: `Home` 도메인 온톨로지
- `login.md`: `Login` 도메인 온톨로지
- `course.md`: `Course` 도메인 온톨로지
- `course-situation.md`: `Course > SituationInput` 서브플로우 온톨로지
- `course-result.md`: `Course > CourseCandidateResult` 서브플로우 온톨로지
- `course-map.md`: `Course > CourseMapPreview` 서브플로우 온톨로지
- `faq.md`: `FAQ` 도메인 온톨로지
- `mypage.md`: `MyPage` 도메인 온톨로지
- `saved.md`: `Saved` 도메인 온톨로지
- `withdraw.md`: `Withdraw` 도메인 온톨로지

## 읽기 순서
도메인 문서를 읽을 때는 아래 순서를 기본값으로 사용한다.

1. 관련 `Execution Spec`
2. 필요 시 `SDD`
3. `README.md`
4. `common.md`
5. 관련 도메인 문서
6. 필요하면 연관 도메인 문서

## 경로-도메인 매핑
아래 표는 어떤 파일을 건드릴 때 어떤 도메인 문서를 먼저 읽어야 하는지 빠르게 찾기 위한 매핑이다.

| 도메인 | 먼저 읽을 문서 | 대표 경로 |
| --- | --- | --- |
| `Home` | `home.md` | `src/app/page.tsx`, `src/widgets/home/**`, `src/features/home/**`, `src/shared/static/home/**` |
| `Login` | `login.md` | `src/app/login/**`, `src/widgets/auth/LoginScreen.tsx`, `src/features/auth/ui/KakaoLoginButton.tsx`, `src/shared/static/auth/**` |
| `Course` | `course.md` | `src/app/course/new/**` 전체 경계, 코스 생성 전반 규칙 |
| `Course > SituationInput` | `course-situation.md` | `src/widgets/situation/**`, `src/features/situation/**`, `src/app/course/new/page.tsx` |
| `Course > CourseCandidateResult` | `course-result.md` | `src/widgets/course-result/**`, `src/features/course-result/**` |
| `Course > CourseMapPreview` | `course-map.md` | `src/widgets/course-map/**`, `src/features/course-map/**` |
| `FAQ` | `faq.md` | `src/app/faq/**`, `src/widgets/faq/**`, `src/features/faq/**`, `src/shared/static/faq/**` |
| `MyPage` | `mypage.md` | `src/app/mypage/page.tsx`, `src/widgets/profile/**`, `src/features/profile/**`, `src/shared/static/profile/**` |
| `Saved` | `saved.md` | `src/app/saved/**`, `src/widgets/saved/**`, `src/features/saved/**`, `src/shared/static/saved/**` |
| `Withdraw` | `withdraw.md` | `src/app/mypage/withdraw/**`, `src/widgets/auth/WithdrawScreen.tsx`, `src/features/auth/ui/WithdrawReasonForm.tsx` |

## 작업 유형별 빠른 규칙
- `PRD`는 도메인 문서를 대체하지 않는다. 제품 이유를 설명할 뿐, 도메인 상태/전이 기준은 여전히 도메인 문서가 원본이다.
- `SDD`는 도메인 문서를 대체하지 않는다. 경계 결정을 설명할 뿐, 개념 정의와 invariant는 도메인 문서가 원본이다.
- `Execution Spec`은 도메인 문서를 대체하지 않는다. 이번 실행 범위만 설명한다.
- 라우트 진입점, 화면 조합, feature, static copy를 함께 건드리면 반드시 해당 도메인 문서를 먼저 읽는다.
- 인증/세션 체크가 있는 도메인은 관련 도메인 문서와 `login.md` 또는 `withdraw.md`를 함께 읽는다.
- FAQ처럼 서버 연동이 아직 없더라도 상태, 전이, 완료 문구가 있으면 도메인 문서에 invariant를 먼저 적고 구현한다.
- 새로운 라우트나 큰 하위 플로우를 추가하면 기존 도메인 문서를 갱신하거나 새 도메인 문서를 추가한다.
- `Course`처럼 큰 도메인은 상위 문서에서 전체 흐름을 설명하고, 구현 시에는 해당 서브플로우 문서를 추가로 읽는다.

## 운영 규칙
- 새 도메인은 먼저 `common.md`의 개념 타입과 관계 타입으로 모델링한다.
- 구현 문서가 아니라 개념 문서로 작성한다.
- 코드 경로 이름이 도메인 이름과 다르면 alias를 반드시 기록한다.
- 상태 전이 규칙은 prose가 아니라 표 형태로 유지한다.
- invariants는 테스트 가능한 문장으로 유지한다.
- 도메인 문서는 “언제 읽는지”, “어떤 경로를 소유하는지”, “무엇을 검증해야 하는지”를 빠르게 찾을 수 있어야 한다.
- 한 문서가 너무 길어지면 하위 서브플로우 문서로 분리하고, 인덱스에서 다시 연결한다.

## 적용 주체
- ArchitectureAgent는 경계와 소유권을 판단할 때 이 문서를 기준으로 삼는다.
- FeatureAgent는 구현 전에 관련 도메인 온톨로지를 읽는다.
- ValidationAgent는 코드가 온톨로지의 states, transitions, invariants를 깨지 않는지 검증한다.
- TestAgent는 acceptance criteria를 테스트로 바꾸기 전에 관련 도메인 invariant를 대조한다.

## 강제 규칙
- 관련 도메인 온톨로지를 읽지 않은 상태에서 구현, 테스트, 검증을 진행하지 않는다.
- 도메인 문서를 읽었는지 여부는 최종 보고에 문서 경로로 남긴다.
- 도메인 문서를 읽지 않고 추측으로 상태, 전이, invariant를 구현하거나 검증하면 규칙 미준수로 본다.

## 작성 우선순위
새 문서를 추가하거나 보강할 때는 아래 우선순위를 따른다.

1. 자주 수정되는 도메인
2. 상태 전이와 invariant가 많은 도메인
3. 인증, BFF, SSR 경계가 섞이는 도메인
4. 공용 UI 계약과 충돌하기 쉬운 도메인
