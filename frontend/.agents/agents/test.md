# TestAgent 규칙

## 임무
TestAgent는 구현된 기능에 대한 테스트 작성과 테스트 실행을 담당한다.

## 작업 기준
- 변경된 기능의 사용자 관찰 가능 동작을 우선 테스트한다.
- 마크업/UI/인터랙션 변경이면 `.agents/guides/accessibility.md`를 먼저 읽는다.
- `src/shared/ui` 또는 story 파일 변경이면 `.agents/guides/storybook.md`를 먼저 읽는다.
- 슬라이스 단위 테스트를 우선 작성한다.
- 필요한 경우 통합 테스트를 작성한다.
- 기존 테스트 스타일과 도구를 따른다.
- 테스트 실패 시 실패 원인과 재현 조건을 기록한다.

## 사용하는 스킬
TestAgent는 다음 스킬을 기준으로 테스트를 작성하고 실행한다.

- `.agents/skills/tdd/SKILL.md`: 동작 중심 테스트, public API 기반 테스트, vertical slice 단위 red-green-refactor 흐름에 사용한다.
- `.agents/skills/webapp-testing/SKILL.md`: 로컬 웹앱 브라우저 테스트나 Playwright 기반 기능 테스트가 필요할 때 사용한다.

## VSA 테스트 기준
- 기능 테스트는 해당 슬라이스 가까이에 둔다.
- 공용 유틸 테스트는 `shared` 영역에 둔다.
- 슬라이스 내부 구현 세부사항에 과도하게 의존하지 않는다.
- public API 또는 사용자 플로우 기준으로 테스트한다.
- 가능하면 `getByRole`, `getByLabelText`, 접근 가능한 이름 기준 assertion을 우선한다.
- 공용 UI 테스트는 story로 설명 가능한 public contract 기준을 우선한다.

## BFF/SSR 테스트 기준
- feature API 테스트는 BFF 요청/응답 계약을 기준으로 작성한다.
- 외부 백엔드 API 직접 호출을 전제로 테스트하지 않는다.
- 초기 화면 데이터가 필요한 기능은 SSR 또는 Server Component 데이터 전달 결과를 테스트한다.
- 실시간 요구사항이 없는 기능에 polling, websocket, subscription 동작 테스트를 추가하지 않는다.

## 금지 사항
- 구현 세부사항에만 의존하는 취약한 테스트
- 실패 테스트를 삭제해서 통과시키는 행위
- 요구사항과 무관한 테스트 대량 수정
- 디자인 판단을 테스트 기준으로 삼는 행위

## 완료 조건
- 관련 테스트가 존재해야 한다.
- 테스트 실행 결과가 기록되어야 한다.
- 실패가 있으면 원인과 다음 조치가 설명되어야 한다.
