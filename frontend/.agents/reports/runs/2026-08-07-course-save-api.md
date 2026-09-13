# Run Log - `2026-08-07-course-save-api`

## Meta (기본 정보)
- date: `2026-08-07`
- owner: `FeatureAgent -> ValidationAgent`
- loop_type: `FullLoop`
- iterations: `1`

## Stages Visited (방문한 실행 단계)
- Intent Capture:
  - 코스 저장 API 연동 작업의 intent brief, solution notes, acceptance criteria를 정리했다.
- Context Load:
  - `course`, `course-map` 도메인 문서와 BFF, server-client-boundary, client-logic-separation 기준을 읽었다.
- Plan and Boundary Decision:
  - 저장은 사용자 상호작용 이후 요청으로 분류했다.
  - 외부 백엔드 호출과 인증/세션 책임은 BFF route와 server transport에 두기로 결정했다.
  - 저장 orchestration은 `useCourseMapScreen`이 소유하고 `SaveCourseSheet`는 입력만 담당하도록 정했다.
- Implement:
  - BFF route, server transport, OpenAPI schema/type, feature model/api/hook/ui, 관련 widget wiring, 도메인 문서 갱신을 반영했다.
- Self Check:
  - 저장 payload 조립이 `widget`으로 새지 않았는지 확인했다.
  - 브라우저 저장 호출이 BFF `/api/courses`만 호출하는지 확인했다.
  - 저장 시트가 입력 전용 UI로 유지되는지 확인했다.
- Evidence Run:
  - 관련 단위 테스트, `npx tsc --noEmit`, `npm run build`를 실행했다.
- Validate:
  - BFF boundary, widget/feature 역할 분리, 로그인 필요 처리, 저장 시트 계약 정렬을 기준으로 검토했다.
  - 최종 결정은 `approved_with_notes`였다.
- Report:
  - validation report를 남겼고 후속 리스크를 기록했다.

## Evidence Summary (증거 요약)
- commands:
  - `npm run test:unit -- --run src/features/course-map/test/save-course.test.ts src/features/course-map/test/api-contract.test.ts src/features/course-map/test/server-course.test.ts src/features/situation/test/request.test.ts src/features/situation/test/region-search.test.ts src/features/situation/test/course-new-page-data.test.ts src/features/situation/test/api-contract.test.ts`
  - `npx tsc --noEmit`
  - `npm run build`
- review:
  - 저장 payload 조립이 `src/features/course-map/model/save-course.ts`에 분리됨
  - 브라우저 저장 호출이 `src/features/course-map/api/save-course.ts`에서 BFF만 호출함
  - `CourseMapScreen`은 화면 조합만 담당하고 저장 orchestration은 `useCourseMapScreen`이 소유함
  - `SaveCourseSheet`는 폼 입력/검증만 담당함

## Failure / Retry (실패 / 재시도)
- failure_stage: `none`
- failure_reason: `none`
- retry_decision: `no_retry`

## Next Action (다음 액션)
- `/saved` 목록/상세 BFF 연동 작업을 별도 범위로 진행한다.
- 저장 성공 직후 사용자 확인 경로를 토스트 의존에서 보강할지 검토한다.
