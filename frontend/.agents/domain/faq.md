# 도메인 온톨로지: FAQ

## Canonical Term
- `FAQ`

## Aliases

| Alias | 종류 | 설명 |
| --- | --- | --- |
| `faq` | route/code | `/faq`, `src/features/faq`, `src/widgets/faq` |
| `contact` | subflow/code | `/faq/contact` 문의하기 입력 흐름 |
| `자주 묻는 질문` | UI label | FAQ 목록 화면의 본문 제목 |

## Domain Goal
- 사용자가 자주 묻는 질문과 답변을 빠르게 탐색할 수 있는 읽기 중심 화면을 제공한다.
- 원하는 답을 찾지 못한 사용자를 문의하기 흐름으로 연결한다.

## 읽어야 하는 경우
- `src/app/faq/**`, `src/widgets/faq/**`, `src/features/faq/**`, `src/shared/static/faq/**`를 수정할 때
- FAQ 항목, 아코디언 상호작용, 문의하기 폼, 완료 다이얼로그를 수정할 때
- FAQ 관련 접근성 테스트나 e2e를 추가할 때

## Entry Routes

| Route | 타입 | Owner |
| --- | --- | --- |
| `/faq` | Route | `src/app/faq/page.tsx` |
| `/faq/contact` | Route | `src/app/faq/contact/page.tsx` |

## 소유 경로

| 계층 | 경로 |
| --- | --- |
| `app` | `src/app/faq/**` |
| `widgets` | `src/widgets/faq/**` |
| `features` | `src/features/faq/**` |
| `shared/static` | `src/shared/static/faq/**` |
| `shared/ui` | `ConfirmDialog`, `AppShell`, `NavBar`, `Button` |

## 사용자 플로우
1. 사용자가 FAQ 목록 화면에 진입한다.
2. 아코디언으로 질문/답변을 확인하거나, 하단 문의하기 CTA로 이동한다.
3. 문의 폼을 입력하고 완료 다이얼로그를 확인한 뒤 FAQ 목록으로 돌아간다.

## Subflows

| Subflow | 목적 | Owner |
| --- | --- | --- |
| `FaqBrowse` | 질문/답변 목록 탐색 | `src/widgets/faq/FaqScreen.tsx`, `src/features/faq/ui/FaqAccordion.tsx` |
| `FaqContact` | 제목, 내용, 이메일을 입력하는 문의 UI 흐름 | `src/widgets/faq/ContactScreen.tsx`, `src/features/faq/ui/ContactForm.tsx` |

## Entities
- 현재 모델링된 독립 Entity 없음

## Value Objects

| 용어 | 구조 | Owner |
| --- | --- | --- |
| `FaqItem` | `q`, `a` | `src/shared/static/faq/index.ts` |
| `ContactDraft` | `subject`, `body`, `email` | `src/features/faq/model/contact-validation.ts` |
| `ContactDoneCopy` | `title`, `body`, `confirm` | `src/shared/static/faq/index.ts` |

## Actions

| Action | 트리거 | 결과 |
| --- | --- | --- |
| `ToggleFaqItem` | 사용자가 질문 버튼 클릭 | 답변 패널 열림/닫힘 |
| `OpenFaqContact` | 사용자가 문의하기 링크 클릭 | `/faq/contact` 진입 |
| `EditContactSubject` | 제목 입력 변경 | `ContactDraft.subject` 갱신 |
| `EditContactBody` | 내용 입력 변경 | `ContactDraft.body` 갱신, 길이 제한 재계산 |
| `EditContactEmail` | 이메일 입력 변경 | `ContactDraft.email` 갱신 |
| `SubmitFaqContact` | 사용자가 문의 남기기 클릭 | 완료 다이얼로그 오픈 |
| `AcknowledgeFaqContactDone` | 완료 다이얼로그 확인/닫기 | `/faq` 복귀 |

## States

| State | 의미 |
| --- | --- |
| `FaqListIdle` | FAQ 목록이 렌더된 상태 |
| `FaqContactIdle` | 문의 폼이 렌더되고 입력을 기다리는 상태 |
| `FaqContactDoneOpen` | 문의 완료 다이얼로그가 열린 상태 |

## Transitions

| From | Action | To | 설명 |
| --- | --- | --- | --- |
| 외부 진입 | `OpenFaqContact` | `FaqContactIdle` | FAQ 하단 CTA 클릭 |
| `FaqContactIdle` | `EditContactSubject` | `FaqContactIdle` | 제목 값만 갱신 |
| `FaqContactIdle` | `EditContactBody` | `FaqContactIdle` | 내용 값과 길이 제한 상태만 갱신 |
| `FaqContactIdle` | `EditContactEmail` | `FaqContactIdle` | 이메일 값만 갱신 |
| `FaqContactIdle` | `SubmitFaqContact` | `FaqContactDoneOpen` | 제목, 내용, 이메일 형식이 유효할 때 |
| `FaqContactDoneOpen` | `AcknowledgeFaqContactDone` | `FaqListIdle` | `/faq`로 이동 |

## Invariants
- FAQ 목록 화면의 본문 제목은 항상 `자주 묻는 질문`이어야 한다.
- 문의하기 CTA는 FAQ 목록 화면 footer에서만 진입해야 한다.
- `ContactDraft.body`는 최대 3000자여야 한다.
- 문의 완료 다이얼로그는 폼 유효성 검사를 통과했을 때만 열린다.
- 현재 `FAQ` 도메인은 문의 발송 API를 소유하지 않는다. 완료 상태는 UI 흐름만 의미한다.
- `ContactForm`는 렌더링 중심으로 유지하고, 라우팅/모달 orchestration 은 hook 또는 model 계층이 소유한다.

## UI 계약
- FAQ 항목은 리스트 구조와 질문 버튼, 답변 패널의 접근성 이름을 가져야 한다.
- 문의 폼의 제목, 내용, 답변받을 이메일 입력은 모두 label을 가져야 한다.
- 문의 남기기 CTA는 공용 `Button`을 우선 사용한다.
- 완료 상태는 공용 `ConfirmDialog`를 사용하고 제목, 본문, 확인 버튼 이름이 카피와 일치해야 한다.

## SSR / BFF / 데이터 규칙
- FAQ 목록 카피와 문의 카피는 정적 콘텐츠로 SSR/SSG 렌더 대상이다.
- FAQ 목록은 클라이언트 fetch 없이 렌더한다.
- 문의 폼은 현재 클라이언트 상태만 소유한다.
- 외부 문의 API가 생기기 전까지 클라이언트에서 임의 외부 호출을 추가하지 않는다.

## Owned UI Artifacts

| UI Artifact | 타입 | Owner |
| --- | --- | --- |
| `FaqScreen` | UIArtifact | `src/widgets/faq/FaqScreen.tsx` |
| `ContactScreen` | UIArtifact | `src/widgets/faq/ContactScreen.tsx` |
| `FaqAccordion` | UIArtifact | `src/features/faq/ui/FaqAccordion.tsx` |
| `ContactForm` | UIArtifact | `src/features/faq/ui/ContactForm.tsx` |

## Owned Implementation

| 개념 | ImplementationOwner |
| --- | --- |
| `FAQ` route entry | `src/app/faq/page.tsx` |
| `FaqContact` route entry | `src/app/faq/contact/page.tsx` |
| `FaqBrowse` 조합 | `src/widgets/faq/FaqScreen.tsx` |
| `FaqContact` 조합 | `src/widgets/faq/ContactScreen.tsx` |
| 문의 폼 orchestration | `src/features/faq/hooks/useContactForm.ts` |
| 문의 검증 규칙 | `src/features/faq/model/contact-validation.ts` |
| FAQ 정적 카피 | `src/shared/static/faq/index.ts` |

## External Relations

| Source | 관계 | Target |
| --- | --- | --- |
| `FAQ` | `hasRoute` | `/faq` |
| `FAQ` | `hasSubflow` | `FaqBrowse` |
| `FAQ` | `hasSubflow` | `FaqContact` |
| `FaqBrowse` | `renders` | `FaqScreen` |
| `FaqContact` | `renders` | `ContactScreen` |
| `ContactForm` | `dependsOn` | `useContactForm` |
| `ContactForm` | `uses` | `ContactDraft` |
| `FAQ` | `uses` | `src/shared/static/faq` |

## Out Of Scope
- 실제 문의 발송 API
- 문의 내역 조회
- 관리자 답변 상태 추적
- FAQ 검색/필터 기능

## 테스트 포인트
- `contact-validation` 단위 테스트로 이메일 형식, 필수값, 3000자 제한을 확인한다.
- FAQ e2e로 `/faq -> /faq/contact -> 완료 다이얼로그 -> /faq` 복귀를 확인한다.
- 아코디언 상호작용을 추가 수정할 때는 역할/이름 기반 테스트를 우선한다.

## Validation Rules
- `FaqScreen`은 목록/CTA 조합만 담당해야 한다.
- `ContactScreen`은 폼 배치만 담당하고 제출 규칙을 직접 소유하면 안 된다.
- 문의 폼에서 `Button`, `ConfirmDialog`, `AppShell`, `NavBar` 같은 기존 공용 UI 재사용 가능 여부를 먼저 검토해야 한다.
- 문의 완료 카피가 실제 서버 성공 의미로 바뀌려면 API 계약 문서와 invariant를 함께 갱신해야 한다.
