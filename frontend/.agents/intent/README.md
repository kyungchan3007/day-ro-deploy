# Intent Engineering

이 디렉터리는 작업 의도를 메모가 아니라 `spec system`으로 관리한다.

## 목적
- 각 작업의 `무엇을·왜·어디까지`(의도)와 설계 결정·acceptance criteria를 남긴다.
- **작성 시점**: 구현 첫 줄 전에 반드시 완성할 필요는 없다. **작업하며 작성하되, 커밋 전까지 완성·확정한다.**
- **intent vs reports 구분**: intent(sdd/tasks)는 **스펙/결정**이다. 실제 실행 로그(무슨 명령·판정·실패 원인 = 블랙박스)는 여기가 아니라 `.agents/reports/`(runs·validation)가 남긴다.
- **필수 대상**: medium/large 작업(API 계약·경계 변경·파일 3+·다세션)은 intent 파일이 **반드시 존재**해야 한다. 소규모는 inline Execution Spec으로 대체 가능(아래 규모별 규칙).
- product intent, solution design, execution criteria를 한 문서에 섞지 않는다.
- 구현, 테스트, 검증이 같은 입력물을 공유하게 만든다.
- active set을 작게 유지해 오래된 intent 파일을 매 작업마다 읽지 않게 한다.

> 강제: `frontend/src/` 앱 코드가 브랜치에서 변경됐는데 intent(sdd/tasks 또는 압축본 archive)가 없으면 **pre-push 훅이 push를 차단**한다(`frontend/.githooks/pre-push`, 프론트 전용 — 백엔드 push는 영향 없음). 팀 셋업은 `frontend`에서 `npm install`(자동) 또는 repo 루트에서 `git config core.hooksPath frontend/.githooks`. 소규모라 의도적으로 생략할 땐 `git push --no-verify`.

## Intent Spec 계층
Intent는 아래 artifact 계층으로 구성한다.

1. `PRD`
   - 왜 이 작업을 하는가
   - 누구에게 어떤 가치가 있는가
   - 범위와 비범위가 무엇인가
2. `SDD`
   - 어떤 구조와 경계로 풀 것인가
   - 어떤 도메인, guide, VSA 경로를 타는가
   - SSR/BFF/client boundary를 어떻게 둘 것인가
3. `Execution Spec`
   - 이번 실행에서 무엇을 바꿀 것인가
   - acceptance criteria가 무엇인가
   - 어떤 evidence로 완료를 판정할 것인가

`Spec Kit`이 필요하다고 표현할 수는 있지만, 운영 문서에서는 이것을 별도 artifact 타입으로 두지 않는다.
`Spec Kit`은 보통 아래 묶음을 뜻한다.

- 작은 작업:
  - inline `Execution Spec` 또는 `.agents/intent/active/current.md`
- 중간 작업:
  - `.agents/intent/active/current.md` + 필요 시 `SDD + Execution Spec`
- 큰 작업:
  - `PRD + SDD + Execution Spec`

## 각 문서의 책임
- `prd/`
  - 사용자 가치, 범위, 비범위, rollout 이유
- `sdd/`
  - boundary decision, affected slice, API/view-model path, risks
- `tasks/`
  - 실제 작업 단위 execution spec

도메인 개념과 invariant는 `intent`가 아니라 `.agents/domain/`이 원본이다.
기술/구현 규칙은 `intent`가 아니라 `.agents/guides/`가 원본이다.

## 작업 규모별 필수 문서
- `작은 작업`
  - 대화 내 inline Execution Spec 또는 `active/current.md` 사용 가능
  - 조건:
    - 파일 2개 이하 수정
    - 도메인/경계 해석이 명확함
    - SSR/BFF/auth/session/shared UI/performance 영향이 없음
- `중간 작업`
  - `active/current.md` + 필요 시 `sdd/ + tasks/`
  - 조건:
    - 파일 3개 이상 수정
    - BFF/API/boundary/client orchestration 포함
    - 도메인 문서 갱신 또는 경계 판단이 필요함
- `큰 작업`
  - `prd/ + sdd/ + tasks/`
  - 조건:
    - 사용자 흐름 또는 제품 정책 변화
    - 공용 UI/API 계약 변화
    - 전역 구조, 성능, auth/session, major route 영향
    - 여러 세션이나 여러 역할 handoff가 예상됨

## 최소 필수 규칙
- 모든 작업은 execution spec이 있어야 한다.
- 작은 작업은 대화 내 inline execution spec으로 대체할 수 있다.
- 파일 기반 execution spec은 `Acceptance Criteria` 없이 시작할 수 없다.
- `sdd/`가 필요한 작업에서 `tasks/`만 쓰고 경계 판단을 생략하면 intent 미준수다.
- `prd/`가 필요한 작업에서 범위/비범위를 대화에만 남기고 문서화하지 않으면 intent 미준수다.
- acceptance criteria는 intent artifact의 일부이며, 별도 메모로 대체하지 않는다.

## Active / Archive Lifecycle (Hot/Cold 운영)
의도 파일은 작업마다 생기지만, 워킹트리에는 최근/진행 중인 것만 둔다(hot). 완료된 의도는 월별 archive 파일로 압축하고 원본은 삭제한다. 원본 전문은 git이 보관한다(cold).

### Hot (제자리 유지)
- `.agents/intent/sdd/`와 `.agents/intent/tasks/`에는 아래만 남긴다.
  - 상태가 `active` 또는 `in-progress`인 의도
  - 완료됐지만 후속 작업이 곧 이어질 의도
  - 가장 최근 날짜 그룹(기본값)
- 기본 읽기 진입점은 `active/index.md` + `active/current.md`다. sdd/tasks 전체를 스캔하지 않는다.

### Cold (압축 보관)
- 완료(`approved`)됐고 후속이 없는 의도는 `.agents/intent/archive/YYYY-MM.md`에 한 블록으로 요약한다.
- 요약 후 원본 sdd/tasks 파일은 삭제한다. 전문이 필요하면 블록의 git 포인터로 `git show <ref>:<path>` 한다.
- 압축 블록 필수 필드는 `.agents/intent/archive/README.md`를 따른다.

### 압축 트리거
- 월 경계에서, 또는 `sdd/` 파일이 15개를 초과할 때 스윕한다.
- `active` 또는 `blocked` 상태의 의도는 절대 압축하지 않는다.

### 조회 규칙 (정확도 보존)
- 어떤 도메인을 작업하기 전, `archive/*.md`에서 해당 `domain` 태그를 grep해 과거 결정을 먼저 확인한다.
- 요약만으로 부족하면 블록의 `원본: <ref> <path>`로 전문을 pull한다.
- 새 SDD를 만들기 전 같은 task/domain의 기존 SDD와 archive 블록을 검색하고, 재사용 또는 `superseded_by` 연결을 우선한다.

### 안전 규칙
- 원본 삭제는 **git에 커밋된 파일만** 대상으로 한다. 미커밋 파일은 삭제하지 않는다.
- 실제 삭제/이동/병합은 배치로 모아 사용자 승인 후 진행한다.
- 공유 브랜치의 history rewrite를 금지한다(콜드 스토리지 보존).

## Acceptance Criteria 규칙
- 기능 문장으로 작성한다.
- 검증 가능한 관찰 결과로 적는다.
- `must`, `must not`, `should`를 사용해 강도를 구분한다.
- 기술 구현 디테일이 아니라 사용자/계약/구조 결과를 기준으로 적는다.

## 실행 연결
- ArchitectureAgent:
  - PRD와 SDD를 보고 경계를 결정한다.
- FeatureAgent:
  - SDD와 Execution Spec을 보고 구현한다.
- TestAgent:
  - Execution Spec의 acceptance criteria를 테스트로 바꾼다.
- ValidationAgent:
  - acceptance criteria와 evidence를 기준으로 최종 판정한다.

## 디렉터리
- `active/README.md`
- `active/index.md`
- `active/current.md`
- `archive/README.md`
- `archive/YYYY-MM.md` (완료 의도 월별 압축)
- `prd/README.md`
- `sdd/README.md` (hot: 최근/진행 중만)
- `tasks/README.md` (hot: 최근/진행 중만)
