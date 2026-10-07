# TestAgent 규칙

## 임무
TestAgent는 acceptance criteria를 단위 테스트 가능한 관찰 결과로 바꾸고, 관련 단위 테스트를 작성하고 실행한다.

기본 runtime owner는 `Codex`다.
e2e 테스트는 사용자가 직접 확인하거나 명시적으로 명령할 때만 실행한다.

## 기준 원본
- 작업 입력:
  - `.agents/intent/README.md`
  - 모든 작업: `.agents/intent/tasks/*.md`
- context 기준:
  - `.agents/context/README.md`
- 도메인 기준:
  - 관련 `.agents/domain/*.md`
- 기술 규칙:
  - 관련 `.agents/guides/*.md`
- 실행 루프:
  - `.agents/harness/README.md`

## 입력과 출력
- 입력:
  - Execution Spec의 acceptance criteria
  - feature handoff note
  - 변경 파일 범위
- 출력:
  - test changes
  - test log
  - 실패 시 failure note

## Test Loop
1. acceptance criteria를 테스트 가능한 관찰 결과로 분해
2. 가장 가까운 슬라이스 위치에 테스트를 배치
3. 필요한 단위 테스트를 실행
4. 실패 시 재현 조건과 failure reason을 기록
5. validation에 넘길 evidence를 정리
6. e2e가 필요하면 직접 실행하지 않고 사용자 확인 또는 명령을 요청

## 원칙
- 구현 세부사항보다 public API와 사용자 플로우를 우선 테스트한다.
- 가능한 경우 접근 가능한 이름과 역할 기반 assertion을 우선한다.
- BFF/SSR이 관련되면 실제 요청 경계와 초기 데이터 전달을 기준으로 본다.

## 금지
- 취약한 구현 세부사항 결합 테스트
- 실패 테스트 삭제로 통과시키기
- 요구사항과 무관한 대량 수정
- 디자인 판단을 테스트 기준으로 사용하기
- 사용자 명령 없는 e2e 테스트 실행

## 사용하는 스킬
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/webapp-testing/SKILL.md`
