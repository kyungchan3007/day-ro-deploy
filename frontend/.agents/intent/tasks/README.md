# Execution Specs

이 디렉터리는 실제 작업 단위의 execution spec을 저장한다.

## 기본 파일명
- `YYYY-MM-DD-<slug>.md`

## 책임
- 실행 단위 범위를 고정한다.
- acceptance criteria를 확정한다.
- 관련 PRD/SDD를 참조한다.
- 이번 실행에서 필요한 evidence를 명시한다.
- active/archive lifecycle 상태를 명시한다.

## 작성 템플릿
아래 형식을 기본값으로 사용한다.

```md
# <작업 제목>

## Task Meta
- task_id:
- date:
- owner:
- status:
- supersedes:
- superseded_by:
- task_type:
- linked_prd:
- linked_sdd:

## Intent Brief
- 사용자 목표:
- 포함 범위:
- 제외 범위:
- 관련 도메인:
- 위험 또는 불명확점:

## Solution Notes
- 예상 진입 경로:
- 변경 예정 슬라이스:
- SSR/BFF/client boundary 판단:
- shared 승격 여부:
- 관련 guide:

## Acceptance Criteria
- must:
- must:
- should:

## Boundary Decisions
- 사용자 확인 필요 여부:
- 결정 내용:

## Evidence Plan
- required commands:
- required review:

## Open Questions / Follow-up
- 
```

## 첫 운영 규칙
- 작은 작업은 대화 내 inline Execution Spec 또는 `.agents/intent/active/current.md`로 대체할 수 있다.
- 중간 이상 작업은 가능하면 실제 작업 시작 전에 이 파일을 먼저 만든다.
- acceptance criteria가 비어 있으면 다음 단계로 진행하지 않는다.
- 중간 이상 작업은 `linked_sdd`를 비우지 않는다.
- 큰 작업은 `linked_prd`, `linked_sdd`를 둘 다 연결한다.
- 완료되거나 대체된 task spec은 active set에서 제거하고 월별 archive로 요약한다.
