# 다른 코스 보기 한도 소진 안내

## Task Meta
- task_id: 2026-10-05-retry-limit-notice
- date: 2026-10-05
- owner: Claude(구현) / Codex(검증)
- status: approved(approve-with-notes)
- supersedes: -
- superseded_by: -
- task_type: 기능 구현(UI/UX)
- linked_prd: - (소규모 UX 정책 변경, issue Dayro-dev/dayro#126)
- linked_sdd: `intent/sdd/2026-10-05-retry-limit-notice.md`

## Intent Brief
- 사용자 목표: 재추천 한도를 다 쓴 사용자가 6번째 시도 시 이유를 안내받는다.
- 포함 범위: 버튼 활성 유지 + 소진 시각 상태, 클릭 시 안내 토스트, 빈 결과 버튼 결함 수정, e2e 기대값 갱신.
- 제외 범위: 분석 이벤트(#125), BFF 한도 초과 오류 매핑(후속).
- 관련 도메인: course-result, course-situation.
- 위험 또는 불명확점: SDD Risks 참조.

## Acceptance Criteria
- must: `remainingRetries`가 0일 때 '다른 코스 보기' 버튼은 클릭·포커스 가능해야 하고 `aria-disabled="true"`로 노출되어야 한다.
- must: 소진 상태 클릭 시 "이 코스의 재추천을 모두 사용했어요. 조건을 바꿔 새 코스를 만들어보세요." 안내 토스트가 노출되어야 한다.
- must not: 소진 상태 클릭 시 loading 단계 라우트 전환·retry API 호출·선택 초기화가 발생하면 안 된다.
- must: 남은 횟수가 1 이상이면 기존 재추천 흐름이 그대로 동작해야 한다.
- must: 재요청 진행 중에는 기존처럼 버튼이 비활성이어야 한다.
- must: 빈 결과 화면의 '다시 추천받기' 버튼은 남은 횟수가 있으면 동작하고, 소진 시 같은 안내를 보여야 한다.
- should: 공용 Button API를 변경하지 않는다.

## Evidence Plan
- required commands: `npm run lint`, `npm run test:unit`, `npm run build`
- required review: Codex validation gate(방식 B), e2e는 사용자 지시 시 실행

## Evidence Result
- lint 0 errors(기존 warning 2), tsc OK, build OK, route bundle budget OK
- unit: `use-course-reroll.test.ts` 5/5 pass(Codex 작성). 전체 589 pass / 2 fail — `faq/test/contact-form.test.tsx` 타임아웃, 변경 제외 baseline에서도 동일 실패(범위 밖 기존 불안정)
- Codex gate: 1차 reject(F1 e2e aria-disabled 판정, F2 빈 결과 상단 버튼, F3 위젯 정책 혼입) → 수정 → 2차 approve-with-notes
- P3(e2e 선택 보존·retry 요청 계수) 반영 완료 — e2e `course-new.spec.ts` 1/1 pass(사용자 지시로 실행, 2026-10-05)
- 리뷰 로그: `reports/runs/2026-10-05-retry-limit-notice.md`
