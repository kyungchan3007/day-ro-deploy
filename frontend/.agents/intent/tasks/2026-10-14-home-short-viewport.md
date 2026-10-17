# 홈 화면 세로가 짧은 기기에서 진입 카드 잘림 (QA #13)

## Task Meta
- task_id: 2026-10-14-home-short-viewport
- date: 2026-10-14
- owner: Claude(UI 수정, 사용자 지시)
- status: review
- task_type: 버그 수정 (QA #13)
- linked_prd: - (소규모 CSS 수정, issue Dayro-dev/dayro#214)
- linked_sdd: - (레이어 경계 변경 없음, widgets/home 내부)
- branch: `fix/#214-home-short-viewport`

## 문제
- 안드로이드 카카오톡 인앱 브라우저(day-ro.com) 홈: 첫 카드 위가 헤더 밑, 둘째 카드 아래가 푸터 밑으로 잘림 (QA 첨부 스크린샷)

## 원인
- 홈 본문(main) = `display:flex` + `justify-content:center` + `overflow-y:auto` (AppShell 본문만 스크롤)
- 카드 묶음이 본문보다 길면 가운데 정렬 때문에 위 · 아래로 똑같이 넘침
- 위로 넘친 부분은 스크롤 시작점보다 위 → 스크롤해도 볼 수 없음
- 인앱 브라우저 상하 툴바 · 큰 글자 설정으로 본문 높이가 짧아질 때 발생

## 결정
- `justify-content: center` 제거 → 카드 묶음(section)에 `margin-block: auto`
  - 공간이 남으면 지금처럼 세로 가운데
  - 넘치면 위부터 시작해 스크롤로 전부 볼 수 있음
- 본문 위아래 여백 `padding-block: 1.5rem` (카드가 헤더 · 푸터에 붙지 않게)
- 범위 밖: 카드 크기 축소 · 푸터 위치 변경 (디자인 변경 없이 잘림만 해결)

## 재현 · 확인 (저장소 밖 임시 스크립트, 포트 3120)
- 수정 전
  - 360×560: 맨 위에서 첫 카드 윗부분 9px 가려짐 (카드 40 < 본문 49)
  - 385×640 · 글자 125%: 23px 가려짐 · QA 스크린샷과 같은 화면
- 수정 후: 세 크기 모두 맨 위에서 첫 카드 전체 · 끝까지 스크롤 시 둘째 카드 전체 보임
- 385×640(기본 글자)은 원래 넘치지 않음 → 화면 변화 없음 (가운데 정렬 유지)

## Evidence Result
- e2e 시나리오 추가: `home.spec.ts` 짧은 화면에서 두 카드 전부 보이기 (실행은 지시 시)
- 결과는 아래 Checks

## Checks
- unit 전체 926 passed · tsc 통과 · eslint 오류 0
- `next build` 성공 · `/` 576078B / 예산 642221B
