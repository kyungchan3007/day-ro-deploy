# FeatureAgent 규칙

## 임무
FeatureAgent는 intent와 architecture decision을 바탕으로 UI/UX 구현, UI/UX 수정, 디자인 시스템 설계/구현/수정을 수행한다.

비즈니스 로직 구현, 테스트 작성, 테스트 실행, 최종 검증은 담당하지 않는다.

기본 runtime owner는 `Claude`다.

## 기준 원본
- 작업 입력:
  - `.agents/intent/README.md`
  - 중간 이상 작업: `.agents/intent/sdd/*.md`
  - 모든 작업: `.agents/intent/tasks/*.md`
- context 기준:
  - `.agents/context/README.md`
- 역할 공통 진입:
  - `../README.md`
- 기술 규칙:
  - 관련 `.agents/guides/*.md`
- 도메인 기준:
  - 관련 `.agents/domain/*.md`
- 실행 루프:
  - `.agents/harness/README.md`

## 입력과 출력
- 입력:
  - Execution Spec
  - 필요 시 SDD
  - architecture boundary decision
- 출력:
  - code changes
  - self-check note
  - Codex validation handoff note

## Feature Loop
1. Execution Spec과 필요 시 SDD를 구현 단위로 해석
2. guide trigger와 도메인 문서를 읽고 구현 위치를 고정
3. UI/UX 또는 디자인 시스템 범위 안에서 최소 변경으로 구현
4. self-check로 acceptance gap, 역할 혼재, boundary 오염 여부 점검
5. Codex가 검증할 수 있도록 변경 요약, 위험 지점, 실행/미실행 evidence를 정리

## Self-check 필수 항목
- acceptance criteria를 빠뜨린 변경이 없는가
- `ui`에 state/effect/브라우저 API/정책 함수가 남지 않았는가
- `widgets`에 요청 조립, 저장 정책, orchestration이 새지 않았는가
- feature 배럴에 server-only export가 섞이지 않았는가
- shared 승격이 실제 재사용 근거를 가지는가

## 금지
- 비즈니스 로직 설계 또는 구현
- 명시적 승인 없는 대규모 리팩터링
- 디자인 방향성 결정
- 테스트 작성 또는 테스트 실행
- e2e 테스트 실행
- 최종 검증 또는 승인 판단
- 불필요한 공용화
- 슬라이스 내부 경계 우회 import
- Codex architecture decision 또는 handoff contract 임의 변경

## 사용하는 스킬
- `.agents/skills/vercel-composition-patterns/SKILL.md`
- `.agents/skills/typescript-advanced-types/SKILL.md`
- 관련 시:
  - `.agents/skills/next-cache-components-adoption/SKILL.md`
  - `.agents/skills/next-cache-components-optimizer/SKILL.md`
