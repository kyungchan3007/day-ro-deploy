# 코스 저장 API 연동 검증

## 작업 일시
- 2026-08-07

## 검증 대상
- `src/app/api/courses/route.ts`
- `src/shared/api/server-course-client.ts`
- `src/shared/api/openapi/dayro.openapi.ts`
- `src/features/course-map/**`
- `.agents/domain/course.md`
- `.agents/domain/course-map.md`

## 최종 결정
- `approved_with_notes`

## 요구사항 확인
- 코스맵 저장 시트가 실제 백엔드 저장 계약으로 `POST /api/courses`를 호출하도록 연결됨
- 비로그인 저장 시도는 로그인 필요 상태로 처리되고 로그인 진입 경로로 연결됨
- 저장 입력 UI가 현재 백엔드 계약과 맞지 않던 `한 줄 설명` 필드를 제거함
- 추천 응답의 `photoUrl`을 저장 스냅샷에 전달할 수 있도록 계약을 확장함

## 변경 파일 요약
- `src/app/api/courses/route.ts`: 인증 쿠키 세션 확인 후 백엔드 저장 API를 호출하는 BFF route 추가
- `src/shared/api/server-course-client.ts`: 인증된 저장 요청 transport 추가
- `src/shared/api/endpoints.ts`, `src/shared/api/openapi/dayro.openapi.ts`: 코스 저장 endpoint/schema/type 추가, `PlaceCandidate.photoUrl` 반영
- `src/features/course-map/model/save-course.ts`: 코스맵 상태를 백엔드 저장 요청으로 직렬화하는 모델 추가
- `src/features/course-map/api/save-course.ts`: 브라우저에서 BFF `/api/courses`를 호출하는 feature API 추가
- `src/features/course-map/hooks/useCourseMapScreen.ts`: 저장 요청 orchestration, 401 로그인 리다이렉트 처리 추가
- `src/features/course-map/ui/SaveCourseSheet.tsx`: 코스명만 받도록 저장 시트 입력 계약 정렬
- `src/widgets/course-map/CourseMapScreen.tsx`, `src/widgets/situation/SituationFlow.tsx`: 저장에 필요한 `answers` 전달
- `.agents/domain/course.md`, `.agents/domain/course-map.md`: 저장 API 연동 기준으로 도메인 문서 갱신

## 실행한 검증 명령
- `npm run test:unit -- --run src/features/course-map/test/save-course.test.ts src/features/course-map/test/api-contract.test.ts src/features/course-map/test/server-course.test.ts src/features/situation/test/request.test.ts src/features/situation/test/region-search.test.ts src/features/situation/test/course-new-page-data.test.ts src/features/situation/test/api-contract.test.ts`
- `npx tsc --noEmit`
- `npm run build`

## 구조/VSA 검토 결과
- 저장 요청 payload 조립은 `src/features/course-map/model/save-course.ts`로 분리되어 `widget`이 직접 요청을 만들지 않음
- 브라우저 저장 호출은 `src/features/course-map/api/save-course.ts`에서 BFF `/api/courses`만 호출해 BFF 경계를 준수함
- `CourseMapScreen`은 여전히 화면 조합만 담당하고, 저장 오케스트레이션은 `useCourseMapScreen`이 소유함
- `SaveCourseSheet`는 폼 입력/검증만 담당하고 실제 네트워크 요청은 상위 훅으로 위임함

## 품질 명령 결과
- 단위 테스트: 7개 파일, 27개 테스트 모두 통과
- 타입체크: `npx tsc --noEmit` 통과
- 빌드: `npm run build` 통과

## 남은 리스크 및 후속 작업
- `/saved` 목록 화면은 아직 정적 placeholder 데이터를 사용하므로, 저장 성공 직후 사용자 확인은 현재 화면 토스트에만 의존함
- 저장 API는 연동됐지만 저장 목록/상세 BFF 연동은 아직 별도 작업 범위
