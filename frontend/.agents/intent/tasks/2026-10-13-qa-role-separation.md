# QA 1차 대응 코드 역할분담 · VSA 경계 정리

## Task Meta
- task_id: 2026-10-13-qa-role-separation
- date: 2026-10-13
- owner: Claude(UI · 구현, 사용자 지시)
- status: review (e2e 완료)
- task_type: 리팩터링 (리뷰 후속)
- linked_prd: `prd/2026-10-13-qa-role-separation.md`
- linked_sdd: `sdd/2026-10-13-qa-role-separation.md`
- branch: `refactor/#192-qa-role-separation`

## 근거
- 리뷰: `.agents/reports/validation/2026-10-13-qa-round1-review.md` (Codex 한도 → 서브에이전트 3개, P2 원본 대조)
- 로컬 서버 브라우저 재확인: 퀴즈 포커스 손실 · 빈칸 제출 (지역 검색어 항목은 재현 방법 오류로 철회)

## Acceptance Criteria
- must: ui 컴포넌트에 useEffect · 오버레이 제어 · 파생 규칙 없음 (SaveCourseSheet · ShareOptionsSheet · ChosungQuizCard)
- must: 잠금 조건 · 로그인 전 인계 · 시트 제어 단일화
- must: 퀴즈 정답 공개 후 다음 문제에서 입력칸 포커스
- must: 기존 e2e · unit 회귀 없음
- should: 저장 재개 hooks 이동 · 공유 동작 분리 · Button 클래스 재사용 · 문구 static

## 구현
- P2
  - `course-map/ui/SaveCourseSheet.tsx` — ui `useEffect` 제거, `useSaveCourseSheet({ open })` 가 닫힘 전이에서 렌더 중 상태 조정으로 문구 리셋 (`resetStatus` 공개 API 제거)
  - `shared/ui/lib/useSheetDialog.ts` 신규 — 마운트 가드 · `useModalDialog` · 바깥 클릭 닫기, `useSaveCourseSheetDialog` · `ShareOptionsSheet` 공용
  - `saved/ui/ShareOptionsSheet.tsx` — 오버레이 제어 제거, 시트 문구 `shared/static/saved.shareSheet`
  - `loading-quiz` — model `isQuizLocked` · `getQuizFeedbackCopy`, 훅이 `locked` · `feedbackCopy` · `inputRef` 제공, 카드는 바인딩만
  - 포커스 복귀 — 문제 전환 후 포커스가 body 면 입력칸으로 (다른 요소 포커스는 유지)
- P3
  - `situation/hooks/useCourseFlowLoginHandoff.ts` 신규 — widget 컨트롤러 · `useCourseMapScreen` 중복 제거, `stashCourseFlowHandoff` 배럴 export 제거
  - `course-map/lib/resume-course-save.ts` — api import 제거(401 판정 주입), 문구 `shared/static/course-map`, 이펙트는 `hooks/useResumePendingCourseSave.ts`
  - `saved/hooks/useCourseShareActions.ts` 신규 — 상세 훅에서 공유 동작 분리, 불필요 `typeof window` 제거
  - `shared/ui/button` `buttonClassName` 공개 — `SharedCourseRedirectScreen` 수동 클래스 복제 제거, 문구 선택 1회
  - `loading-quiz` 배럴 `CHOSUNG_QUIZ_*` · `shouldRevealAnswer` export 제거, 문구 `shared/static/loading-quiz`, `SituationLoadingScreen` 공개 타입 재사용
  - `MenuItem.stories` `AsLinkWithIntercept` 추가, `AccountMenu` import 순서 · `SituationFlow` 들여쓰기
- 유지(사유): server 파일 상대경로 import 는 기존 server 폴더 관례라 변경하지 않음

## Evidence Result
- tsc 통과 · eslint 0 errors (기존 `useWheelColumn.ts` 경고 1건, 범위 밖)
- unit (storybook 제외) 73 files · 796 passed
  - 신규 `feedback-copy.test.ts`, `attempt-policy.test.ts` `isQuizLocked` 추가
  - 갱신 `pending-course-save.test.ts`(401 판정 주입) · `save-analytics.test.ts`(situation 모킹)
- `next build` 통과 · 라우트 번들 예산 16개 통과 · 품질 가드 40 passed
- e2e (사용자 지시 2026-10-13): 별도 worktree, 포트 3120 · 목 백엔드 18091
  - 신규 3건: 퀴즈 포커스 복귀 · 저장 시트 바깥 클릭(문구 초기화 · 포커스 복귀) · 공유 시트 바깥 클릭(포커스 복귀)
  - 대상 15/15 · 전체 64/64 통과
  - 수정 전 코드(develop 0203834): 퀴즈 포커스 시나리오 실패 확인, 시트 2건은 통과(리팩터 동작 불변 회귀 확인용)
  - e2e 중 발견: Playwright `keyboard.type` 한글은 insertText 경로라 포커스가 body 여도 입력칸에 들어감 → 확인 단계를 실제 키 이벤트(`press("a")`)로 변경
  - 녹화 영상 4개(퀴즈 수정 전 · 후, 저장 시트, 공유 시트) → 노션 13 리팩토링 리팩터 TASK
- 번들(first-load JS, develop → 브랜치): `/` 575,099 → 575,642B · `/course/new` 623,633 → 624,936B · `/saved` 675,418 → 676,039B
- 로컬 서버(사용자 FE 3000 · BE 8080, 이 브랜치) 내장 브라우저 확인
  - 오답 3회 Enter → 공개 중 `activeElement = BODY` (입력 잠금)
  - 2초 뒤 다음 문제 → `activeElement = INPUT` (수정 전 develop 은 BODY 유지), 퀴즈 문구 정상 표시
