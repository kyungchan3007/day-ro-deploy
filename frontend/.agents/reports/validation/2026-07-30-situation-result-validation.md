# 상황 결과 화면 검증 리포트

## 작업 일시
- 2026-07-30

## 검증 대상
- `loading -> result` 전환 로직
- 결과 화면 장소 선택/재추천 구조 분리
- `course/new` e2e 동작
- 빌드, unit test, lint(core-web-vitals 포함), Web Vitals 관련 리스크

## 최종 결정
- `rejected`

## 요구사항 확인
- `loading` 이후 결과 화면 분리 자체는 구현되어 있음
- 로딩 최소 1초 보장 규칙은 최초 진입 경로에서는 구현 의도가 보임
- 결과 화면 장소 선택 규칙은 `model`/`hook` 으로 분리됨
- 다만 동일 답변으로 재진입 시 최소 1초 로딩 보장이 깨질 수 있어 요구사항을 완전히 충족했다고 보기 어려움
- 결과 화면 재추천 이후 저장 브리지 일관성도 깨질 수 있음

## 변경 파일 요약
- `src/widgets/situation/hooks/useSituationFlowController.ts`
  - `loading/result` 분기와 결과 화면 전환 추가
- `src/features/situation/hooks/useCourseGeneration.ts`
  - 최소 로딩 시간 + API 완료 phase 관리 추가
- `src/features/situation/hooks/useCourseSelection.ts`
  - 장소 선택 상태 훅 추가
- `src/features/situation/model/course-generation.ts`
  - 로딩 전환 순수 규칙 추가
- `src/features/situation/model/course-selection.ts`
  - 장소 선택 순수 규칙 추가
- `src/widgets/situation/SituationResultScreen.tsx`
  - 결과 화면/재추천/선택 완료 브리지 추가

## 실행한 검증 명령
- `npm run lint`
- `npm run test:unit`
- `npm run build`
- `npm run test:e2e -- src/app/e2e/course/course-new.spec.ts`

## 구조/VSA 검토 결과
- 긍정
  - 선택 규칙이 `model/course-selection.ts` 와 `useCourseSelection.ts` 로 분리되어 결과 화면 컴포넌트가 순수 렌더링/이벤트 조합에 가깝게 유지됨
  - 로딩 전환 규칙도 `model/course-generation.ts` 로 빠져 있어 책임 경계는 이전보다 명확함
  - `SituationFlow` 는 `loading/result/step` 라우팅 셸 역할에 가까워졌음
- 이슈
  - `useCourseGeneration` 이 이전 성공 상태를 유지한 채 같은 답변 재진입을 막아, 동일 입력 재추천/재진입에서 컨트롤러가 stale phase 를 소비할 수 있음
  - 결과 화면 재추천은 새로운 응답을 로컬 state 로만 교체하고 공통 저장 브리지를 갱신하지 않아 브리지 일관성이 깨질 수 있음

## 품질 명령 결과
- `npm run test:unit`
  - 통과
  - `40 passed`, `120 passed`
- `npm run build`
  - 통과
- `npm run test:e2e -- src/app/e2e/course/course-new.spec.ts`
  - 통과
  - 단, 현재 e2e 는 여전히 `purpose` 스텝까지만 검증하고 결과 화면/선택/재추천 플로우는 검증하지 않음
- `npm run lint`
  - 실패
  - 현재 변경과 직접 관련 없는 `.claude/skills/**/*.cjs` 의 `require()` 사용으로 실패

## 남은 리스크 및 후속 작업
- `src/features/situation/hooks/useCourseGeneration.ts`
  - 동일 답변으로 `loading` 재진입 시 stale `success/minElapsed` 상태와 `submittedKeyRef` 때문에 최소 1초 로딩 보장이 깨질 수 있음
- `src/widgets/situation/SituationResultScreen.tsx`
  - 재추천 응답을 `saveLastGeneratedCourseCandidates` 로도 갱신하지 않아 새 결과가 리마운트/새로고침 시 유지되지 않을 수 있음
- Web Vitals
  - 실제 Lighthouse/Web Vitals 측정 도구는 저장소에 준비되어 있지 않아 수치 기반 검증은 못 함
  - 대신 `vitest` 실행 중 LCP 경고가 계속 관찰됨
  - `/src/shared/ui/logo/assets/logo-horizontal.webp`
  - `/src/shared/ui/logo/assets/logo-symbol.webp`
  - `/src/shared/ui/logo/assets/logo-full.webp`
  - `/src/shared/ui/illustration/assets/map-pin.webp`
  - `/src/shared/ui/illustration/assets/date-planning.webp`
  - 이번 변경 화면이 직접 이 자산들을 추가한 것은 아니지만, LCP 후보 이미지의 eager/priority 전략은 별도 점검 필요
