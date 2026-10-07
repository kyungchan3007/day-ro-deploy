# 상황입력 3단계 플로우 검증

## 작업 일시
- 2026-07-20

## 검증 대상
- `/course/new` 상황입력 플로우의 URL query 기반 step 제거
- `time -> region -> transport -> loading` 3단계 전환
- 이동수단 화면 진행 표시 `3/3`

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- `?step=transport` 방식의 URL query 전환 제거: 충족
- step 진행 표시가 3단계 기준으로 동작: 충족
- 이동수단 선택 후 목적 step 없이 추천 로딩으로 진입: 충족

## 변경 파일 요약
- `src/widgets/situation/hooks/useSituationFlowController.ts`: `useSearchParams`, `usePathname`, `router.push` query 전환 제거. 내부 `useState`로 현재 step 관리.
- `src/features/situation/model/flow.ts`: step registry를 `time`, `region`, `transport` 3단계로 축소.
- `src/widgets/situation/SituationFlow.tsx`: `purpose` 분기 제거.
- `src/widgets/situation/SituationTransportScreen.tsx`: 기본 total step을 `3`으로 변경.
- `src/app/course/new/page.tsx`: query 의존 제거에 따라 `Suspense` 제거.
- `src/features/situation/model/types.ts`, `src/features/situation/ui/situationChips.tsx`: 누적 답변과 요약 칩에서 `purpose` 제거.
- `.agents/domain/course.md`: 도메인 플로우 문서를 3단계 내부 상태 전환으로 갱신.

## 실행한 검증 명령
- `npx tsc --noEmit`
- `npm run lint`
- `npx eslint src .agents/domain/course.md`
- `npm run build`

## 구조/VSA 검토 결과
- 변경은 기존 `situation` feature/widget 경계 안에서 끝났다.
- step registry와 전이 규칙은 `features/situation/model` 및 `widgets/situation/hooks`에 유지되어 screen UI에 섞이지 않았다.
- URL query 해석 책임이 제거되어 route page는 단순 진입점으로 정리됐다.
- 신규 shared 승격이나 슬라이스 간 내부 import 추가는 없다.

## 품질 명령 결과
- `npx tsc --noEmit`: 통과.
- `npx eslint src .agents/domain/course.md`: source lint 통과. Markdown 도메인 문서는 ESLint 설정 대상이 아니라 ignored warning 1건 발생.
- `npm run lint`: 실패. 변경 범위와 무관한 `.claude/skills/**/*.cjs` 파일의 기존 `@typescript-eslint/no-require-imports` 에러 15건 및 warning 1건.
- `npm run build`: 최초 sandbox 실행은 Google Fonts 네트워크 fetch 실패. 승인된 네트워크 환경 재실행 결과 통과.

## 남은 리스크 및 후속 작업
- `SituationPurposeScreen`, `PurposeOptionGrid`, `usePurposeStep`, `PurposeChoice`는 플로우에서 미사용 상태로 남아 있다. 실제로 목적 입력을 폐기하는 것이 확정이면 별도 승인 후 정리 가능하다.
- 전체 `npm run lint`는 `.claude/skills`가 lint 대상에 포함되는 기존 설정 문제로 실패한다. 앱 소스 변경과는 별도 이슈다.
