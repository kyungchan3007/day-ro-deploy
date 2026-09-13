# 저장 코스 경계/SSR 검증 리포트

## 작업 일시
- 2026-08-07 17:58:49 KST

## 검증 대상
- `src/app/saved/page.tsx`
- `src/app/saved/[id]/page.tsx`
- `src/app/api/courses/**`
- `src/features/saved/**`
- `src/features/course-map/**`
- `src/shared/api/**`
- `.agents` 문서 변경분

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- 저장 코스 목록과 상세 라우트가 SSR 엔트리로 유지되는지 확인했다.
- `saved` feature 배럴이 client-safe export 만 노출하는지 확인했다.
- 서버 전용 page data 함수가 `src/features/saved/server/index.ts`로 분리되었는지 확인했다.
- `next/headers` 의존 코드가 클라이언트 import graph 에 연결되지 않는지 확인했다.
- 저장 상세 화면이 공통 지도 화면 셸 위에 CTA 정책만 덧붙이는 구조인지 확인했다.

## 변경 파일 요약
- `src/features/saved/index.ts`: client-safe public API 만 노출
- `src/features/saved/server/index.ts`: 서버 전용 public API 분리
- `src/app/saved/page.tsx`, `src/app/saved/[id]/page.tsx`: 서버 전용 entry import 사용
- `src/features/course-map/ui/SaveCourseSheet.tsx`: UI 렌더링 중심으로 정리
- `src/features/course-map/hooks/useSaveCourseSheet.ts`, `useSaveCourseSheetDialog.ts`: 저장 폼 상태와 dialog side effect 분리
- `.agents/*`: client logic, server-client boundary, validation start protocol 규칙 추가

## 구조/VSA 검토 결과
- `saved` 도메인 route entry 와 client widget 이 같은 feature 배럴을 공유하지 않도록 분리되어 있다.
- `src/widgets/saved/SavedListScreen.tsx`, `SavedCourseDetailScreen.tsx`는 클라이언트 안전 배럴 `@/features/saved`만 본다.
- `src/app/saved/page.tsx`, `src/app/saved/[id]/page.tsx`는 `@/features/saved/server`만 본다.
- `next/headers`는 `src/shared/api/server-course.ts`, `src/shared/api/server-auth-session.ts`에만 남아 있으며, client graph 오염 흔적은 확인되지 않았다.
- `SaveCourseSheet.tsx`는 state/effect/orchestration 이 분리되어 UI 역할 기준을 충족한다.
- `SavedListScreen`은 목록 조합만, `SavedCourseDetailScreen`은 공통 지도 화면 셸 + CTA 조합만 담당한다.
- 구조 위반 finding 은 이번 검증 범위에서 발견하지 못했다.

## 실행한 검증 명령
- `npx tsc --noEmit`
- `npm run build`
- `npm run lint -- src/app/saved src/app/api/courses src/features/saved src/features/course-map src/shared/api`
- `npm run test:unit -- --run src/features/course-map/test/save-course.test.ts src/features/course-map/test/server-course.test.ts src/features/course-map/test/api-contract.test.ts src/features/saved/test/saved-course.test.ts src/features/saved/test/saved-course-detail.test.ts src/features/saved/test/server-saved-courses.test.ts src/features/saved/test/server-saved-course-detail.test.ts`
- `rg -n "next/headers|cookies\\(|headers\\(" src`
- `rg -n "@/features/saved/server|@/features/saved\\"|@/features/saved'" src/app src/widgets src/features`

## 품질 명령 결과
- `npx tsc --noEmit`: 통과
- `npm run build`: 통과
- `npm run lint -- ...`: 통과
- 단위 테스트: 7개 파일, 15개 테스트 통과

## 성능 검토 결과
- `TTFB`: `/saved`, `/saved/[id]`는 SSR 경로이므로 서버 데이터 준비 영향이 있다. build 기준 라우트 생성은 정상 완료됐다.
- `FCP`: 저장 화면 클라이언트 위젯이 서버 전용 코드를 끌어오지 않도록 배럴을 분리해 초기 클라이언트 경계 오염 리스크를 줄였다.
- `INP`: 저장 상세의 reorder, sheet 상호작용은 훅 분리로 UI 과밀이 완화됐다.
- `CLS`: 오버레이와 토스트는 기존 구조를 유지하며, 이번 변경에서 새로운 레이아웃 밀어내기 징후는 코드상 보이지 않았다.
- `LCP`: 목록/상세 화면의 실제 runtime LCP 후보는 브라우저 계측 없이 확인하지 못했다.

## 남은 리스크 및 후속 작업
- 브라우저 실환경 smoke test 는 이번 검증에서 실행하지 않았다. `/saved`, `/saved/[id]` 실제 네비게이션 확인은 별도 필요하다.
- Core Web Vitals 는 코드/빌드 기준으로만 검토했고, 실측 수치는 없다.
- 작업 트리에 사용자/진행 중 변경이 함께 있으므로, 최종 머지 전 범위 재검증이 한 번 더 필요할 수 있다.
