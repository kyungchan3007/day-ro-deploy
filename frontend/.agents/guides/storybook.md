# 스토리북 운영 지침

## 목적
- 공용 UI 컴포넌트를 기능 코드와 분리해서 문서화하고 검증 가능한 상태로 유지한다.
- 현재 단일 서비스 구조와 추후 모노레포 `packages/ui` 분리 이후에도 동일한 기준을 유지한다.
- 에이전트가 공용 UI를 수정하면서 stories를 빠뜨리는 일을 막는다.

## 적용 범위
다음 중 하나라도 해당하면 이 문서를 먼저 읽고 반영한다.

- `src/shared/ui` 컴포넌트 추가/수정
- 여러 도메인에서 재사용할 공용 컴포넌트 승격
- 스토리북 story 파일 추가/수정
- 향후 `packages/ui` 또는 공용 디자인 시스템 패키지 작업
- 공용 UI의 상태, 변형, 접근성 계약 문서화가 필요한 작업

## 절대 원칙
- Storybook은 디자인 놀이터가 아니라 공용 UI 계약 문서다.
- feature 전용 화면 전체를 무분별하게 story로 만들지 않는다.
- story는 공용 컴포넌트의 public props와 사용자 관찰 가능 상태만 보여준다.
- 내부 구현 세부사항, 임시 mock 구조, feature 전용 store를 story 계약으로 노출하지 않는다.
- 시맨틱 마크업과 접근성 상태는 story에서도 유지되어야 한다.

## 범위 기준

### Storybook 대상
- `shared/ui`에 있는 버튼, 입력, 카드, 메뉴, 다이얼로그, 내비게이션, 피드백 컴포넌트
- 여러 도메인에서 재사용되는 조합 컴포넌트
- 모노레포 전환 후 `packages/ui`로 이동 가능한 후보

### Storybook 비대상
- 특정 도메인 흐름에 강하게 묶인 `features/*` 내부 구현
- 라우팅, 데이터 패칭, BFF 호출, 페이지 진입점
- 화면 전체 위저드, 한 서비스 전용 임시 조합

## 파일 배치 기준
- 현재 구조에서는 `src/shared/ui/stories/**` 아래에 story를 모아 관리한다.
- story 폴더는 컴포넌트 분류를 따라간다.
  - 예: `src/shared/ui/button/Button.tsx`
  - 예: `src/shared/ui/stories/button/Button.stories.tsx`
- 기본 형식은 `<ComponentName>.stories.tsx`를 우선한다.
- 모노레포 전환 후에는 `packages/ui/src/**` 또는 패키지 규칙에 맞춰 동일 원칙을 유지한다.

## Story 작성 기준
- CSF 형식을 사용한다.
- `Meta`, `StoryObj` 기반으로 작성한다.
- 한 story 파일에는 컴포넌트의 핵심 상태만 남긴다.
- 최소한 다음 상태를 검토한다.
  - 기본 상태
  - 변형 variant
  - 비활성 disabled
  - 선택됨, 열림, 오류 등 사용자 관찰 가능 상태
  - 긴 텍스트 또는 경계값 상태
- 데코레이터는 정말 공용으로 필요한 컨테이너만 사용한다.
- 라우터, 서버 데이터, 전역 store 의존이 필요하면 먼저 API를 단순화할 수 있는지 검토한다.

## 접근성 기준
- story에서도 역할과 이름 계산이 유지되어야 한다.
- 아이콘 버튼이면 접근 가능한 이름이 있어야 한다.
- 다이얼로그, 드로어 story는 제목, 설명, 포커스 시작점을 확인 가능한 상태로 둔다.
- 선택 컴포넌트는 `button`인지 `radio`인지 `checkbox`인지 역할 계약이 story에서 드러나야 한다.

## 모노레포 대비 기준
- 지금 `src/shared/ui`에 들어가는 컴포넌트는 추후 `packages/ui` 이동 가능성을 전제로 설계한다.
- story가 feature import에 기대면 안 된다.
- 공용 UI는 도메인 데이터 구조보다 props 계약으로 분리한다.
- story args만으로 주요 상태를 재현할 수 있게 만든다.

## 에이전트 작업 규칙
- 공용 UI를 새로 만들거나 API를 바꾸면 story 필요 여부를 반드시 판단한다.
- 기존 story가 있으면 컴포넌트 수정과 함께 갱신한다.
- story를 만들지 않는 경우에는 이유가 명확해야 한다.
  - 예: feature 전용 컴포넌트
  - 예: 아직 shared 승격 근거 부족
- Storybook 설정이 아직 repo에 없더라도 향후 추가될 수 있게 파일 구조와 props API를 story 친화적으로 유지한다.

## 체크리스트
- 이 컴포넌트가 실제로 공용 UI인가
- public props만으로 상태를 설명할 수 있는가
- 기본 상태와 주요 변형이 분리되어 있는가
- 접근성 역할과 이름이 story 기준으로도 설명 가능한가
- feature, store, router 의존 없이 story를 만들 수 있는가
- 추후 `packages/ui`로 이동해도 import 경계가 깨지지 않는가
