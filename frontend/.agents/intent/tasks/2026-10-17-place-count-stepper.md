# 상황입력 장소 수 스테퍼

## Task Meta
- task_id: 2026-10-17-place-count-stepper
- date: 2026-10-17
- owner: Claude
- status: review
- task_type: 기능(UI) · QA #9
- issue: Dayro-dev/dayro#247
- branch: `feat/#247-place-count-stepper`

## 할 일
- [x] model `place-count` · `SituationAnswers.placeCount` · 스냅샷 스키마
- [x] hook `usePlaceCountStep` · ui `PlaceCountStepper` · 문구 static · 아이콘 `MinusIcon` · `PlusIcon` · 토큰 `--shadow-control`
- [x] 시간 화면 배치 · `setTime(time, placeCount)`
- [x] unit(place-count) · 스토리(PlaceCountStepper, 조작 play) · e2e(범위 · 복원 · 요청 미전송)
- [x] 번들 예산: `/share/course` 초과 → 원인은 course-map 이 situation 기본 배럴을 런타임 import → 좁은 진입점 `features/situation/handoff.ts`
	- `/share/course` · `/saved` · `/saved/[id]` 첫 로드 JS 689557 → 663669B (−25.9KB, 압축 전)
- [x] tsc · eslint · vitest 1065 · e2e 96 · build · 예산
- [x] Codex 검증 approved_with_notes → F1~F3 반영 → 2차 approved
- [x] 영상 · 노션(주차 · 26주차 · QA #9 · UI/UX 개선 · 성능개선 TASK)

## 백엔드 요청 (별도)
- `SituationInputRequest.placeCount`(2~5) · 추천 개수 반영 · 저장 후 최소 개수 규칙(시간 기준 2/3/4곳) 정리
