# SDD Specs

이 디렉터리는 solution design을 저장한다.

## 언제 쓰는가
- boundary decision이 필요한 중간 이상 작업
- BFF/API/auth/session/client orchestration이 있는 작업
- 도메인 문서만으로 구현 위치가 정해지지 않는 작업

## 책임
- 어떤 경로와 슬라이스가 바뀌는가
- 어떤 guide와 domain이 기준 원본인가
- SSR/BFF/client boundary를 어떻게 둘 것인가
- shared 승격 여부와 리스크가 무엇인가

## 작성 템플릿

```md
# <작업 제목> SDD

## Meta
- sdd_id:
- date:
- owner:
- status:
- supersedes:
- superseded_by:

## Scope Path
- affected routes:
- affected slices:
- related guides:
- related domains:

## Design Decisions
- SSR/BFF/client boundary:
- public API boundary:
- shared promotion decision:
- orchestration owner:

## Data / Contract Notes
- request path:
- response path:
- model/view-model decision:

## Risks
- 

## Validation Notes
- what must be reviewed:
- expected evidence:
```

## Lifecycle 규칙
- 새 SDD를 만들기 전에 같은 task/domain의 기존 SDD를 검색한다.
- boundary decision이 같으면 기존 SDD를 재사용하거나 보강한다.
- boundary decision이 바뀌면 기존 SDD의 `superseded_by`를 연결하고 새 SDD를 만든다.
- 완료되거나 대체된 SDD는 active set에서 제거하고 월별 archive로 요약한다.
- 기존 SDD 파일 이동, 삭제, 병합은 사용자 승인 후 진행한다.
