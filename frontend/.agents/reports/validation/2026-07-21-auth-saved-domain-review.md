# auth/saved 도메인 추가 검증

## 작업 일시
- 2026-07-21

## 검증 대상
- `withdraw` 및 `saved` 도메인 관련 신규 라우트/위젯/feature/static 추가
- 상황입력 플로우 동시 변경분 포함 리뷰

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- 신규 도메인 코드가 빌드/타입체크 가능한지 확인: 충족
- 사용자 관찰 가능 동작의 명백한 결함 여부 점검: 보완 필요 사항 존재
- VSA 구조와 도메인 문서 일치 여부 확인: 일부 불일치 존재

## 변경 파일 요약
- `src/app/mypage/withdraw/page.tsx`, `src/widgets/auth/WithdrawScreen.tsx`, `src/features/auth/ui/WithdrawReasonForm.tsx`: 회원탈퇴 진입/사유 선택/확인 모달 UI 추가
- `src/app/saved/page.tsx`, `src/widgets/saved/SavedListScreen.tsx`, `src/features/saved/ui/SavedCourseCard.tsx`, `src/shared/static/saved/index.ts`: 찜한 코스 목록 화면 추가
- `src/shared/ui/dialog/*`, `src/shared/ui/icon/*`, `src/shared/ui/auth/WithdrawButton.tsx`: 공용 dialog/icon/button 확장
- `src/features/situation/*`, `src/widgets/situation/*`, `.agents/domain/course.md`: 상황입력 step/query 플로우 변경

## 실행한 검증 명령
- `npx tsc --noEmit`
- `npm run test:unit -- src/features/situation/test/course.test.ts`
- `CI=1 E2E_CHANGED_FILES='frontend/src/features/situation/model/flow.ts' npm run test:e2e:affected`
- `npm run build`
- `npm run lint`

## 구조/VSA 검토 결과
- 신규 `withdraw`, `saved` 화면은 `app -> widgets -> features/shared` 경계 안에 배치돼 구조 자체는 무리 없다.
- 회원탈퇴 폼의 상태 전이와 모달 제어는 `features/auth/ui/WithdrawReasonForm.tsx`에 모여 있어 현재 범위에서는 허용 가능하지만, 실제 탈퇴 API/세션 종료가 붙으면 `model` 또는 `hooks` 분리가 필요하다.
- 상황입력 플로우는 `useSituationFlowController`가 route query 해석과 전이를 담당하고 `SituationFlow`는 switcher 역할만 유지해 구조는 적절하다.
- 도메인 문서 `.agents/domain/course.md`는 현재 코드와 불일치가 남아 있다.

## 품질 명령 결과
- `npx tsc --noEmit`: 통과
- `npm run test:unit -- src/features/situation/test/course.test.ts`: 통과
- `CI=1 E2E_CHANGED_FILES='frontend/src/features/situation/model/flow.ts' npm run test:e2e:affected`: 통과
- `npm run build`: 기본 sandbox 실행은 Google Fonts fetch 실패, 네트워크 허용 환경 재실행 결과 통과
- `npm run lint`: 실패. 변경 범위와 무관한 `.claude/skills/**/*.cjs`의 기존 `require()` import 규칙 위반 15건

## 남은 리스크 및 후속 작업
- `/saved` 목록 카드가 모두 `href="#"`로 연결돼 있어 클릭 시 실질적인 상세 이동이 없다.
- `WithdrawReasonForm`는 `etc` 선택 후 입력 없이도 다음으로 진행할 수 있다. 제품 요구사항이 “직접 입력”에 실내용 텍스트를 요구한다면 guard 추가가 필요하다.
- `.agents/domain/course.md`는 현재 코드가 `time -> region -> purpose` 3단계인 반면 여전히 `transport` step을 문서화한다.
- `frontend/test-results/.last-run.json`는 생성물 성격의 파일이라 추적 대상 유지 여부를 점검할 필요가 있다.
