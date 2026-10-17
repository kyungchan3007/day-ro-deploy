# 코스 결과 "다른 코스 보기" 버튼 · "남은 N회" 시각 구분 (QA #10)

## Task Meta
- task_id: 2026-10-13-reroll-button-contrast
- date: 2026-10-13
- owner: Claude(UI 구현, 사용자 지시)
- status: review
- task_type: UX 개선 (QA #10)
- linked_prd: - (소규모 UI 수정, issue Dayro-dev/dayro#206)
- linked_sdd: - (레이어 경계 변경 없음, widgets/course-result 내부)
- branch: `style/#206-reroll-button-contrast`

## 문제
- "다른 코스 보기"(secondary 연회색 버튼)와 "남은 N회"(연회색 알약 칩)가 거의 같은 모양
- 칩도 버튼처럼 보여 잘못 누르게 됨 (QA #10)

## 결정 (사용자 확정, 색 조합 예시 확인 후 ④ + ⓐ)
- "다른 코스 보기": `variant="primary"` (진보라 채움 + 흰 글자)
- "남은 N회": 배경 없는 글자 `text-muted` 13px · 숫자만 `primary` 굵게
- 한도 소진: 기존대로 `aria-disabled` + 흐림(opacity 40) · 클릭 시 안내 유지
- 하단 "선택완료"(lg · 풀폭)와 크기 · 위치로 위계 구분 (sm · 인라인)

## Acceptance Criteria
- must: 다른 코스 보기 버튼이 진보라 채움
- must: 남은 횟수가 버튼 · 알약 모양이 아님
- must: 한도 소진 시 흐림 + 클릭 안내 동작 유지
- must: 기존 e2e `getByText(/남은 \d+회/)` 텍스트 유지

## Evidence Result
- unit `widgets/course-result/test/course-result-reroll.test.tsx` 3 passed
  - 수정 전 코드에서 2건 실패 확인 (버튼 색 · 남은 횟수 마크업)
- unit 전체 914 passed · tsc 통과 · eslint 오류 0
- `next build` 성공 · 번들 예산 이내
- e2e: 지시 시 실행
