# 클라이언트 로직 분리 가이드

## 목적
이 문서는 React/Next.js 클라이언트 코드에서 `ui` 렌더링과 클라이언트 로직을 강제로 분리하기 위한 기준이다.

이 가이드는 권장 사항이 아니라 구현 기본 규칙이다.

## 핵심 원칙
- HTML/JSX 태그를 반환하는 컴포넌트와 클라이언트 로직은 역할이 다르다.
- `ui` 파일은 마크업 조합과 접근성 속성 연결만 담당한다.
- `state`, `effect`, 이벤트 정책, 브라우저 API 접근, 요청 트리거, 파생 상태 계산은 `ui` 밖으로 분리한다.
- `use client` 파일이라고 해서 모든 클라이언트 로직을 그 파일 안에 함께 두어도 된다는 뜻은 아니다.
- 한 파일 안에서 태그와 로직이 함께 보이면 기본적으로 분리 후보가 아니라 분리 대상이다.

## 트리거 조건
다음 중 하나라도 해당하면 이 문서를 작업 직전에 다시 읽는다.

- `use client` 파일을 새로 만들거나 수정한다.
- `useState`, `useReducer`, `useEffect`, `useLayoutEffect`, `useRef`를 추가하거나 수정한다.
- `onClick`, `onSubmit`, `onChange`, `onKeyDown` 등 이벤트 핸들러에서 정책 판단이 들어간다.
- `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, `history`를 사용한다.
- 다이얼로그, 바텀시트, 드로어, 토스트, 탭, 스텝 플로우의 열림 상태나 전이 규칙을 다룬다.
- 저장, 제출, 재시도, 공유, 수정 완료 같은 사용자 액션 이후 후속 UX 정책을 다룬다.
- `router.push`, `router.replace`, `redirect`, query string 해석이 들어간다.

## Intent 연결
- `SDD`는 클라이언트 orchestration owner를 결정할 때 이 문서를 기준으로 삼는다.
- `Execution Spec`은 어떤 `ui / hooks / model / api` 파일이 실제 수정 범위인지 정할 때 이 문서를 참조한다.
- 이 문서는 로직 분리 규칙의 원본이며, 작업 목표와 완료 조건은 intent 문서가 정의한다.

## 강제 분리 규칙
- `ui` 컴포넌트 안에 `useEffect`를 두지 않는다.
- `ui` 컴포넌트 안에 복수의 `useState`와 정책 함수 묶음을 두지 않는다.
- `ui` 컴포넌트 안에 브라우저 이벤트 등록/해제 로직을 두지 않는다.
- `ui` 컴포넌트 안에 request payload 조립, DTO 정규화, 저장 성공/실패 후속 정책을 두지 않는다.
- `ui` 컴포넌트 안에 포커스 트랩, ESC 닫기, 포커스 복귀, 바깥 클릭 닫기 같은 오버레이 제어 로직을 두지 않는다.
- `ui` 컴포넌트 안에 `entity -> view props`, `status -> copy`, `form state -> CTA state` 같은 파생 규칙을 두지 않는다.

## 허용 범위
`ui` 컴포넌트에 남겨도 되는 것은 아래로 제한한다.

- props 수신
- 하위 컴포넌트 조합
- 시맨틱 태그 작성
- aria 속성, label, role, description id 연결
- 이미 분리된 훅/모델이 내려준 값과 핸들러를 JSX에 바인딩하는 일
- 단순 표시용 분기

## 배치 규칙
- React 상태와 side effect 를 가진 클라이언트 orchestration 은 `features/*/hooks`에 둔다.
- hook이 아닌 순수 규칙과 파생 계산은 `features/*/model` 또는 `features/*/lib`에 둔다.
- 서버/BFF 호출은 `features/*/api`에 둔다.
- `widgets`는 분리된 상태와 액션을 받아 화면만 조합한다.
- `shared` 승격은 두 개 이상 슬라이스 재사용 근거가 있을 때만 허용한다.

## 구현 절차
클라이언트 로직이 포함된 작업은 아래 순서를 강제로 따른다.

1. 먼저 이 문서를 다시 읽는다.
2. 수정 대상 파일에서 태그 책임과 클라이언트 로직 책임을 분리해서 적는다.
3. `ui`에 남길 것과 `hooks/model/api`로 옮길 것을 먼저 결정한다.
4. 그다음에 JSX 수정이나 hook 추가를 시작한다.
5. 구현 후에는 `ui` 파일에 state, effect, 브라우저 API, 정책 함수가 남아 있는지 다시 점검한다.

## 체크리스트
구현 전후로 아래 질문에 모두 `yes`여야 한다.

- 이 `ui` 파일은 태그와 접근성 연결만 담당하는가?
- 상태 모델과 상태 전이는 hook 또는 model에 있는가?
- 브라우저 API 접근이 `ui` 밖에 있는가?
- 저장/제출/공유/수정 완료 후속 정책이 `ui` 밖에 있는가?
- 오버레이 열림 상태와 닫힘 정책이 `ui` 밖에 있는가?
- 파생 view-model 계산이 `ui` 밖에 있는가?

하나라도 `no`이면 분리가 덜 된 것으로 본다.

## 금지 예시
- `SaveCourseSheet.tsx` 같은 렌더링 파일 안에 `useEffect`, 포커스 트랩, submit 정책을 함께 두는 것
- `CourseMapScreen.tsx` 같은 화면 파일 안에 request payload 조립과 저장 후 라우팅 정책을 함께 두는 것
- `SavedCourseDetailScreen.tsx` 같은 화면 파일 안에 상세 데이터 정규화와 drag 정책을 함께 두는 것

## 예외
예외는 없다.

단, 아주 작은 로컬 상태 하나만 필요한 경우에도 먼저 분리 가능성을 검토한다. 검토 없이 `ui`에 남기지 않는다.

## 검증 기준
- FeatureAgent는 클라이언트 로직 작성 직전에 이 문서를 다시 읽었다고 작업 응답에 명시한다.
- ValidationAgent는 변경된 `ui` 파일에 state/effect/policy/browser API가 남아 있으면 구조 위반으로 판단한다.
- TestAgent는 구조를 바꾸지 않지만, 테스트 작성 중 드러난 역할 혼재를 보고해야 한다.
