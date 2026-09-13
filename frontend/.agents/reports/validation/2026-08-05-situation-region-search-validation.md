# Situation Region Search 검증 리포트

## 작업 일시
- 2026-08-05

## 검증 대상
- `src/features/situation/**`
- `src/widgets/situation/**`
- `src/shared/api/openapi/dayro.openapi.ts`
- `src/shared/ui/{field,select}/**`
- `.agents/domain/course-situation.md`
- `AGENTS.MD`

## 최종 결정
- `rejected`

## 요구사항 확인
- `dong` 필드를 포함한 백엔드 계약 반영 여부를 확인했다.
- `name`/`dong` 검색과 구 자동 매칭 로직 분리 여부를 확인했다.
- 변경 범위에 `shared/ui` 승격, 상황입력 화면, OpenAPI 계약, 도메인 문서가 포함되어 있음을 확인했다.
- fresh verification evidence 기준으로 타입체크, 테스트, 린트, 빌드를 실제 실행했다.

## 변경 파일 요약
- 상황입력 지역 검색 로직이 `model`/`hooks`로 분리되었다.
- 지역 화면이 `Select` + 검색 리스트 조합으로 바뀌었다.
- `shared/ui`에 `SearchField`, `Select`가 추가되고 story가 함께 추가되었다.
- region OpenAPI 계약에 `dong` 필드가 추가되었다.
- 도메인 문서와 운영 규칙 문서가 갱신되었다.

## 실행한 검증 명령
- `npx tsc --noEmit`
- `npx vitest run src/features/situation/test/api-contract.test.ts src/features/situation/test/course.test.ts src/features/situation/test/request.test.ts src/features/situation/test/region-search.test.ts src/features/situation/test/server-situation.test.ts src/shared/api/server-situation.test.ts`
- `npm run lint`
- `npm run build`

## 구조/VSA 검토 결과
- `region-search` 순수 규칙이 `src/features/situation/model/region-search.ts`로 분리된 점은 적절하다.
- `useRegionStep`가 지역 상태 orchestration을 맡고 `SituationRegionScreen`이 조합 위주로 정리된 점은 적절하다.
- `shared/ui`에 추가된 `SearchField`, `Select`는 story가 함께 추가되어 공용 계약 관리 기준은 충족한다.
- 직접적인 BFF 경계 위반, 외부 백엔드 직접 호출, widget 내부 fetch 위반은 발견하지 못했다.

## 품질 명령 결과
- `npx tsc --noEmit`: 통과
- `vitest`: 6 files, 22 tests 통과
- `npm run lint`: 실패
  - `.claude/skills/**`의 `.cjs` 스크립트에서 `@typescript-eslint/no-require-imports` 오류 15건
  - `public/mockServiceWorker.js` unused eslint-disable warning 1건
- `npm run build`: 실패
  - `/course/new` prerender 중 `regionsResponseSchema`가 `dong` 없는 region payload를 받아 Zod parse 에서 실패

## 주요 findings
1. `/course/new` 프로덕션 빌드가 깨진다.
   - `src/shared/api/openapi/dayro.openapi.ts`에서 `dong`을 필수로 바꿨지만, 실제 prerender 시점 backend payload 에는 `dong`이 빠져 있다.
   - 결과적으로 `src/app/course/new/page.tsx` -> `getInitialRegionGroups` -> `getSituationRegions` 경로가 빌드 중 ZodError로 중단된다.
2. 린트가 저장소 기준으로 통과하지 않는다.
   - 이번 변경 파일이 아니라 `.claude/skills/**` 스크립트들이 원인이지만, 현재 저장소 상태에서는 품질 게이트가 red 상태다.

## 남은 리스크 및 후속 작업
- backend가 아직 `dong`을 안정적으로 내려주지 않는 환경이 있다면, 빌드/SSR이 계속 깨진다.
- 해결 방향은 둘 중 하나다.
  - backend와 seed/mock/static data를 전부 `dong` 포함 계약으로 맞춘다.
  - 또는 transition 기간 동안 프론트 schema를 `dong` optional + fallback 처리로 완화한다.
- lint 실패는 이번 변경과 직접 무관해 보여도, 저장소 전체 게이트 기준으로는 별도 정리 필요하다.
