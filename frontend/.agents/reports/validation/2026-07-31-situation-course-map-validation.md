# 상황입력 코스 지도 화면 검증 리포트

## 작업 일시
- 2026-07-31

## 검증 대상
- `src/features/situation/**`
- `src/widgets/situation/**`
- 코스 후보 결과 화면 이후의 신규 `course` 단계 추가
- 지도/장소 리스트/저장 바텀시트 UI 추가

## 최종 결정
- `rejected`

## 요구사항 확인
- 변경 코드 확인: 완료
- 역할 분담 점검: 부분 충족
- 검증 명령 실행: 완료
- 접근성 점검: 실패 항목 존재

## 변경 파일 요약
- `model/flow`에 `course` 후속 상태 추가
- `useSituationFlowController`에 `result -> course` 전환 추가
- `useSelectedCourse`, `useKakaoMap`, `kakao-map-loader`로 저장소/지도 SDK 책임을 feature 계층에 배치
- `SituationCourseMapScreen`에서 지도 화면 조합
- `CourseMap`, `CoursePlaceList`, `SaveCourseSheet` UI 추가

## 실행한 검증 명령
- `git status --short`
- `git diff --stat`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run test:unit`
- `npm run build`
- `npx eslint src/features/situation/hooks/index.ts src/features/situation/index.ts src/features/situation/lib/generated-course-storage.ts src/features/situation/model/flow.ts src/widgets/situation/SituationFlow.tsx src/widgets/situation/hooks/useSituationFlowController.ts src/features/situation/hooks/useKakaoMap.ts src/features/situation/hooks/useSelectedCourse.ts src/features/situation/lib/kakao-map-loader.ts src/features/situation/ui/CourseMap.tsx src/features/situation/ui/CoursePlaceList.tsx src/features/situation/ui/SaveCourseSheet.tsx src/widgets/situation/SituationCourseMapScreen.tsx`

## 구조/VSA 검토 결과
- 긍정
- `SituationFlow`는 새 `course` 화면까지 포함해 여전히 얇은 스위처로 유지됐다.
- 라우팅과 step 전환은 `src/widgets/situation/hooks/useSituationFlowController.ts`에 남아 있고, 저장소 접근은 `useSelectedCourse`, 지도 SDK 관리는 `useKakaoMap`/`kakao-map-loader`로 분리돼 있다.
- `widgets`에서 외부 API 직접 호출, storage 직접 접근, request builder 사용은 보이지 않았다.
- 이슈
- 도메인 문서가 구현과 불일치한다. `.agents/domain/course.md`는 `SituationFlowStep`을 `SituationStepKey | loading`으로만 정의하고 결과/코스 상태를 반영하지 않으며, `Out Of Scope`에 `코스 결과 렌더링`, `저장/찜 동작`을 그대로 남겨 두었다. 반면 구현은 `src/features/situation/model/flow.ts`와 `src/widgets/situation/hooks/useSituationFlowController.ts`에서 `result`, `course` 상태와 전환을 이미 소유한다.

## 품질 명령 결과
- `npm run lint`: 실패. 다만 실패 원인은 이번 변경부가 아니라 `.claude/skills/**/*.cjs`의 기존 `require()` 규칙 위반 15건과 `public/mockServiceWorker.js` warning 1건이었다.
- `npx tsc --noEmit`: 성공
- `npm run test:unit`: 성공, `40 passed`, `121 passed`
- `npm run build`: 성공
- 변경 파일 대상 `npx eslint ...`: 성공

## 남은 리스크 및 후속 작업
- 접근성 실패: `src/features/situation/ui/SaveCourseSheet.tsx`는 `role="dialog"`와 `aria-modal`은 있으나 포커스 순환과 포커스 복귀를 구현하지 않았다. 닫힌 상태에서도 DOM에 남아 있는 입력/버튼이 탭 순서에서 완전히 제거되지 않아 숨겨진 시트에 포커스가 들어갈 수 있다.
- 테스트 공백: 신규 `course` 단계, `SaveCourseSheet`, `useSelectedCourse`, `useKakaoMap`에 대한 단위/통합 테스트가 추가되지 않았다. 현재 통과한 121개 테스트는 기존 회귀만 보장한다.
- 문서 불일치: `.agents/domain/course.md`를 현재 상태/전환/범위에 맞게 갱신해야 한다.
