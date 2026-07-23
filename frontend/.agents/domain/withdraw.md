# 도메인 온톨로지: Withdraw

## Canonical Term
- `Withdraw`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `withdraw` | route/code | `/mypage/withdraw`, `src/features/auth/ui/WithdrawReasonForm.tsx`, `src/widgets/auth/WithdrawScreen.tsx` |
| `회원탈퇴` | UI label | 내 정보 화면에서 진입하는 계정 탈퇴 분기 |

## Domain Goal
- 사용자가 계정 탈퇴 의사를 확인하고 이탈 이유를 선택할 수 있는 전용 흐름을 제공한다.
- 실제 계정 삭제 API 없이도 탈퇴 이유 선택, 확인, 완료 상태를 일관된 UI 흐름으로 노출한다.

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/mypage/withdraw` | Route | `src/app/mypage/withdraw/page.tsx` |

## Subflows
- 현재 모델링된 하위 흐름 없음

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | 설명 |
| --- | --- | --- |
| `WithdrawReasonOption` | `value`, `label` | 탈퇴 이유 선택지 한 항목 |
| `WithdrawReasonSelection` | 문자열 집합 | 사용자가 복수 선택한 탈퇴 이유 값 집합 |
| `WithdrawEtcText` | string | `etc` 선택 시 입력하는 자유 서술 텍스트 |
| `WithdrawConfirmCopy` | `title`, `body`, `cancel`, `confirm` | 확인 모달 카피 |
| `WithdrawDoneCopy` | `title`, `body`, `confirm` | 완료 모달 카피 |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `OpenWithdrawFlow` | 사용자가 내 정보 화면에서 회원탈퇴 링크 클릭 | `Withdraw` 도메인 진입 |
| `ToggleWithdrawReason` | 사용자가 사유 항목 클릭 | 탈퇴 이유 선택 집합 갱신 |
| `EditWithdrawEtcReason` | 사용자가 직접 입력 textarea 수정 | 자유 입력값 갱신 |
| `OpenWithdrawConfirm` | 사용자가 다음 버튼 클릭 | 확인 모달 오픈 |
| `CancelWithdraw` | 사용자가 확인 모달 취소/닫기 | 확인 모달 종료 |
| `ConfirmWithdraw` | 사용자가 탈퇴하기 클릭 | 완료 모달 오픈 |
| `AcknowledgeWithdrawDone` | 사용자가 완료 모달 확인 클릭 | 홈으로 이동 |

## States

| State | 의미 |
| --- | --- |
| `WithdrawFormIdle` | 탈퇴 사유 폼이 노출되고 입력을 기다리는 상태 |
| `WithdrawConfirmOpen` | 탈퇴 확인 모달이 열린 상태 |
| `WithdrawDoneOpen` | 탈퇴 완료 모달이 열린 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| 외부 진입 | `OpenWithdrawFlow` | `WithdrawFormIdle` | 내 정보 화면에서 회원탈퇴 진입 |
| `WithdrawFormIdle` | `ToggleWithdrawReason` | `WithdrawFormIdle` | 선택 집합만 갱신 |
| `WithdrawFormIdle` | `EditWithdrawEtcReason` | `WithdrawFormIdle` | 자유 입력값만 갱신 |
| `WithdrawFormIdle` | `OpenWithdrawConfirm` | `WithdrawConfirmOpen` | 최소 1개 사유 선택 시 |
| `WithdrawConfirmOpen` | `CancelWithdraw` | `WithdrawFormIdle` | 모달만 닫음 |
| `WithdrawConfirmOpen` | `ConfirmWithdraw` | `WithdrawDoneOpen` | 실제 탈퇴 API는 아직 없음 |
| `WithdrawDoneOpen` | `AcknowledgeWithdrawDone` | 외부 홈 상태 | `/`로 이동 |

## Invariants
- `Withdraw`는 현재 UI 흐름만 소유하고 실제 계정 삭제/세션 종료 로직은 소유하지 않는다.
- 탈퇴 사유는 최소 1개 이상 선택돼야 다음 버튼이 활성화된다.
- `WithdrawConfirmOpen`과 `WithdrawDoneOpen`은 동시에 열리면 안 된다.
- `WithdrawScreen`은 화면 조합만 담당하고 사유 선택/모달 상태는 `WithdrawReasonForm`이 소유한다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `WithdrawScreen` | UIArtifact | `src/widgets/auth/WithdrawScreen.tsx` |
| `WithdrawReasonForm` | UIArtifact | `src/features/auth/ui/WithdrawReasonForm.tsx` |
| `ConfirmDialog` | UIArtifact | `src/shared/ui/dialog/ConfirmDialog.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `Withdraw` route entry | `src/app/mypage/withdraw/page.tsx` |
| `WithdrawScreen` 조합 | `src/widgets/auth/WithdrawScreen.tsx` |
| `WithdrawReasonForm` public API | `src/features/auth/index.ts` |
| `Withdraw` 정적 카피 | `src/shared/static/auth` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `Withdraw` | `hasRoute` | `/mypage/withdraw` |
| `Withdraw` | `renders` | `WithdrawScreen` |
| `WithdrawScreen` | `renders` | `WithdrawReasonForm` |
| `WithdrawReasonForm` | `uses` | `shared/static/auth` |
| `OpenWithdrawFlow` | `dependsOn` | `MyPage` |
| `AcknowledgeWithdrawDone` | `dependsOn` | `Home` |

## Out Of Scope
- 실제 회원탈퇴 API 호출
- 세션 만료/로그아웃 처리
- 탈퇴 이유 서버 저장
- 탈퇴 완료 후 재가입 정책

## Validation Rules
- `WithdrawScreen`은 조합 아티팩트로 유지되어야 한다.
- `WithdrawReasonForm`은 현재 UI 상태 전이를 소유할 수 있지만, 실제 API/세션 로직이 붙으면 `model` 또는 `hooks`로 분리해야 한다.
- 확인/완료 모달 카피와 버튼 라벨은 `shared/static/auth`의 탈퇴 카피와 일치해야 한다.
