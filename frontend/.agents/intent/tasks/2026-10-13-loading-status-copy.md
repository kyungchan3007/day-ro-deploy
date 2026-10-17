# 코스 생성 로딩 화면 안내 문구 A안 (버튼 위 · 완료 ✅)

## Task Meta
- task_id: 2026-10-13-loading-status-copy
- date: 2026-10-13
- owner: Claude(UI 구현, 사용자 지시)
- status: review
- task_type: UX 개선 (QA #22)
- linked_prd: - (소규모 UI 수정, issue Dayro-dev/dayro#203)
- linked_sdd: - (레이어 경계 변경 없음, features/situation 조각 추가 · widgets 조합)
- branch: `style/#203-loading-status-copy`

## 문제
- 로딩 안내 문구가 화면 맨 아래(`LoadingScreen` message/subMessage)에 있어 "코스 보러 가기" 버튼과 떨어져 있음
- 생성 완료 후에도 "만들고 있어요" 문구가 그대로 남아 완료 여부를 문구로 알 수 없음

## 결정 (A안, 사용자 확정)
- 위치: 셀렉션 티커 아래 · "코스 보러 가기" 버튼 바로 위
- 생성 중: "Dayro에서 데이트 코스를 만들고 있어요" / "잠시만 기다려주세요!"
- 완료: "✅ 코스가 완성됐어요!" / "아래 버튼을 눌러 코스를 확인해 보세요"
- 문구는 `shared/static/situation` · 상태 → 문구 선택은 `features/situation/model/loading-status.ts`
- UI `features/situation/ui/SituationLoadingStatus.tsx`: 보이는 문구(role=status, aria-live=polite) + 다른 상태 문구 invisible 사이저(같은 grid 칸) → 전환 시 버튼 · 퀴즈 밀림 없음
- ✅ 는 aria-hidden (스크린리더는 문구만 읽음)
- `LoadingScreen` 의 `message` 를 선택값으로 → 없으면 하단 문구 블록 미표시 (다른 사용처 동작 유지)

## Acceptance Criteria
- must: 생성 중 버튼 위에 생성 중 문구
- must: 완료 시 같은 자리에 ✅ 완료 문구, 버튼 활성
- must: 문구 전환 시 레이아웃 밀림 없음
- must: 하단 기존 문구 제거

## Evidence Result
- unit `features/situation/test/loading-status.test.tsx` 5 passed (문구 선택 · status 영역 · ✅ aria-hidden · 사이저)
- e2e 기대값 갱신: `course-new.spec.ts` 2곳(버튼 활성 시 완료 문구) · `course-loading-quiz.spec.ts` 1곳(생성 중/완료 중 하나)
- 검증 결과는 아래 Checks 참고

## Checks
- tsc 통과 · eslint 신규 오류 0 (기존 `useWheelColumn.ts` 경고 1건, 이번 변경 무관)
- unit 전체 108 files · 906 passed
- `next build` 성공 · `check-route-bundle-budget` 전 라우트 예산 이내
- e2e: 사용자 지시 시 실행 (스모크 테스트는 사용자가 3000 서버에서 확인)
