# 장소 2곳 코스 네이버 도보 길찾기 경유지 슬롯 누락

## Task Meta
- task_id: 2026-10-13-two-place-route
- date: 2026-10-13
- owner: Claude(구현, 사용자 지시)
- status: review
- task_type: 버그 수정 (운영 반영 누락)
- linked_prd: - (소규모 수정, issue Dayro-dev/dayro#197)
- linked_sdd: - (구조 변경 없음, features/course-map 내부)
- branch: `fix/#197-two-place-route`

## 문제
- #163(최소 선택 4곳 → 1곳) 이후 장소 2곳 코스 생성 가능
- 네이버 웹 길찾기 주소 `출발/도착/경유지/이동수단` 4칸 고정 → 경유지 없을 때 칸을 빼면 `walk` 가 경유지 칸으로 밀려 도보 경로 미표시
- 수정 커밋 da29b7e(2026-10-11)가 PR#164 머지(2026-10-10) 뒤 같은 브랜치에 올라가 develop · main 미반영 (2026-10-13 발견)

## 결정
- da29b7e 를 develop 기준 새 브랜치로 cherry-pick (내용 그대로)
- 빈 경유지 칸 = `-` (2026-10-11 장소 2곳 도보 경로 실측 근거)
- 범위 밖: 장소 1곳(출발 = 도착) 동작 → 정책 결정 후 별도

## Acceptance Criteria
- must: 장소 2곳 → `…/directions/{출발}/{도착}/-/walk`
- must: 장소 3곳 이상 → 기존 경유지 `:` 이어 붙이기 유지

## Evidence Result
- unit `features/course-map` 9 files · 47 passed (route-deeplink 테스트 갱신 포함) · tsc 통과
- 기존 e2e `course-map-route-guide.spec.ts` 는 `directions/` · `/walk` 포함만 확인 → 영향 없음
- 내장 브라우저는 map.naver.com 접근이 안전 정책으로 막혀 이번 재실측 불가 → 스모크 테스트에서 실제 네이버 화면 확인 필요
