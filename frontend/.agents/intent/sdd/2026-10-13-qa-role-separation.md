# QA 1차 대응 코드 역할분담 · VSA 경계 정리 SDD

## Meta
- sdd_id: 2026-10-13-qa-role-separation
- date: 2026-10-13
- owner: Claude(구현, 사용자 지시)
- status: approved(design)
- issue: Dayro-dev/dayro#192

## Design Decisions
- 시트 제어 공용화 — `shared/ui/lib/useSheetDialog`
  - 마운트 여부 · `useModalDialog` 연결 · 바깥 클릭 닫기를 한 훅으로
  - 저장 시트(`useSaveCourseSheetDialog`) · 공유 시트(`ShareOptionsSheet`)가 함께 사용 (재사용 근거 2곳)
- 저장 시트 문구 리셋 — ui `useEffect` 제거, `useSaveCourseSheet({ open })` 가 렌더 중 상태 조정으로 닫힘 시 리셋 (기존 `useAuthSession` 패턴)
- 퀴즈
  - 잠금 조건 `isQuizLocked(solved, feedback)` — model, 훅 가드와 ui 가 같은 함수 사용
  - 피드백 문구 선택 `getQuizFeedbackCopy` — model, 문구 원본은 `shared/static/loading-quiz`
  - 포커스 복귀 — 훅이 input ref 소유, 문제 전환 후 포커스가 body(손실)면 입력칸으로 복귀 (다른 요소에 포커스가 있으면 유지)
  - 카드 props: `locked` · `feedbackCopy` · `inputRef` 바인딩, widget 은 공개 타입 `UseChosungQuizResult` 재사용
  - 배럴: 외부 사용처 없는 `CHOSUNG_QUIZ_*` · `shouldRevealAnswer` export 제거
- 로그인 전 흐름 인계 — situation 이 `useCourseFlowLoginHandoff(rev)` 공개, widget 컨트롤러 · course-map 이 같은 훅 사용
- 저장 재개 — `lib/resume-course-save.ts` 의 api · 토스트 orchestration 을 hooks 계층으로, 문구는 static
- 저장 코스 상세 — 공유 동작을 `useCourseShareActions` 로 분리
- 공유 이동 화면 — 공용 Button 클래스 공개(`buttonClassName`)로 수동 복제 제거

## 레이어
- shared/ui/lib ← features(course-map · saved) 사용, 역참조 없음
- situation 공개 훅 ← course-map · widgets/situation (기존 의존 방향 유지)

## Risks
- 포커스 복귀가 사용자가 옮긴 포커스를 빼앗지 않게 body 일 때만 복귀
- 리팩터 범위가 넓어 회귀 위험 → 전체 unit · e2e 로 확인
