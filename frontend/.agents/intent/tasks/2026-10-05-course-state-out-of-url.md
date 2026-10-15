# 코스 만들기 상태 URL 밖 이동

## Task Meta
- task_id: 2026-10-05-course-state-out-of-url
- date: 2026-10-05
- owner: Claude(구현·coordinator) / 독립 검증 세션 또는 Codex(검증)
- status: approved(approve-with-notes) — 독립 검증 라운드 2
- task_type: 아키텍처 → 기능 구현(리팩터) → 검증
- linked_prd: `intent/prd/2026-10-05-course-state-out-of-url.md`
- linked_sdd: `intent/sdd/2026-10-05-course-state-out-of-url.md`
- issue: Dayro-dev/dayro#129 · branch `refactor/#129-course-state-out-of-url`

## Acceptance Criteria
- must: `/course/new` 모든 단계 주소에는 `step`과 선택적 8자 `rev`(및 유입 키)만 있어야 하며, 조건·requestId·후보·선택 장소·retry 키가 포함되면 안 된다.
- must: 같은 탭 새로고침 시 같은 단계·조건·후보·선택이 복원되어야 하고, 페이지 조회·복원 과정에서 코스 생성·재추천 API가 호출되면 안 된다.
- must: 브라우저 뒤/앞으로 가기 시 해당 시점(rev)의 화면이 복원되어야 하며, 재추천 잔여 횟수는 최신 값이어야 한다.
- must: 재추천(잔여 횟수)·소진 안내(#126)·코스 저장·로그인 왕복(401 → /login?next → 복귀) 흐름이 기존과 동일하게 동작해야 한다.
- must: 복원 실패 시 자동 생성 없이 조건이 완전하면 purpose, 아니면 첫 미완료 단계로 안내되어야 한다.
- must: loading 중 새로고침 등으로 실행 주체를 잃으면 자동 재전송 없이 안내 후 purpose로 이동해야 하고, 같은 문서 재진입은 새 요청 없이 기존 요청을 이어야 한다.
- must: 레거시/미지 쿼리 주소는 생성 요청·Meta 전송 없이 `?step=time`으로 정리되어야 한다(유입 키 보존).
- must: 코스 화면(loading 포함)에서 Meta 이벤트가 발행되어야 하고, Meta 차단 계약은 `/course/new`의 step·rev 외 키·중복 키·fragment를 계속 차단해야 한다.
- must not: 복원 시 `course_generated`·`course_regenerated` 등 이벤트가 재발행되면 안 된다.
- must not: 저장소 접근 실패가 코스 생성·결과 표시를 실패로 바꾸면 안 된다(메모리 폴백).
- should: LCP·CLS 회귀 없음, 번들 예산 통과, 기존 e2e(course-new·loading-quiz·route-guide) 통과.

## Boundary Decisions
- 사용자 확인: 진행 방식 = 경계 있는 토론(2026-10-05), 합의안 승인 + 구현은 Claude(2026-10-05)

## Evidence Result (Claude, 2026-10-05)
- lint 0 errors(기존 warning 2) · tsc OK · build OK
- unit 645 pass / 2 fail — `faq/test/contact-form.test.tsx` 타임아웃(기존 불안정)
- route bundle budget 통과 — #125 직후 대비 `/course/new` +3,253B, 그 외 +269B 내외 (baseline 미변경)
  - 구현 중 발견·수정: ① `page.tsx`가 client 배럴(`@/features/situation`) import → `/course/new` +76KB (server-client-boundary.md 33행 위반) → 서버 helper가 redirect URL 반환 ② course-flow 스키마의 신규 zod API(`record`·`lte`·`safeParse`)가 전 라우트 공유 zod 청크를 +8KB 키움 → 기존 API만 사용, record 직접 검증
- e2e(사용자 지시): 전체 15/15 pass — `course-new`(주소 step·rev만, 새로고침 후 동일 후보·생성 요청 0회 추가), `course-map-route-guide`(UI 흐름으로 코스 진입), `course-loading-quiz`
  - 1차 실패: 새로고침 검증이 공유 목 백엔드 통계를 사용해 병렬 테스트 요청이 섞임 → 페이지 단위 요청 카운트로 변경
- 파일 삭제(사용자 승인): `course-result/lib/generated-course-storage.ts`, `course-result/hooks/useRestoredCourseCandidates.ts` 및 각 테스트

## Validation
- 독립 검증 세션 라운드 1 reject: P1 복원 실패 시 무한 갱신(매 렌더 새 `{}` + effect deps → replace 53회, Maximum update depth), P2 마지막 재추천 뒤 소진 토스트 누락(#126 회귀), P3 생성 실패 시 loading 정지·Meta 차단 범위 문서화·rev modulo bias
- 수정: 빈 answers 상수 + 주소/operation 단위 1회 가드, 잔여 횟수 비교는 result 단계만, `failed` operation 상태 + 실패 안내 후 purpose, rejection sampling, 문서 갱신, e2e(복원 실패·레거시 정리·소진 안내) 추가
- 라운드 2 approve-with-notes → P3 2건 반영: 정상 복원 시 fallback 가드 초기화, 저장 상태 파싱을 레코드 단위로(깨진 항목만 제외)
- 최종: lint 0 errors · tsc · unit 647 pass(FAQ 기존 2 fail) · build · 번들 예산 · e2e 16/16
- 리포트: `reports/validation/2026-10-05-course-state-out-of-url.md`

## Follow-up
- 저장 401 → `/login?next=...` 후 `next` 미사용으로 항상 홈 이동(기존 결함) — 사용자 지시: 이 브랜치 완료 후 새 이슈·브랜치로 처리
- 후속 후보: `useSituationFlowController` 책임 분리(약 330줄), 실제 브라우저 뒤/앞·새 탭 복원 수동 확인, Lighthouse LCP·CLS 비교
