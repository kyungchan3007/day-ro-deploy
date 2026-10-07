# 활성 Intent

이 디렉터리는 현재 작업에 필요한 최소 intent만 유지한다.

## 목적
- 에이전트가 매번 오래된 PRD, SDD, task 파일을 훑지 않게 한다.
- 현재 진행 중인 작업과 바로 이어질 작업만 활성 목록으로 둔다.
- 완료되거나 대체된 intent는 월별 archive로 접는다.

## 파일
- `index.md`
  - 현재 활성 intent 목록과 읽기 우선순위
- `current.md`
  - 현재 세션 또는 현재 task의 경량 intent

## 규칙
- 작은 작업은 `current.md` 또는 대화 내 실행 명세로 충분하다.
- 중간 작업은 `current.md`에 요약하고, 필요할 때만 별도 SDD/task 파일을 만든다.
- 큰 작업은 별도 PRD/SDD/task 파일을 만들고 `index.md`에서 링크한다.
- 활성 파일은 완료 후 비우거나 archive로 요약 이관한다.
