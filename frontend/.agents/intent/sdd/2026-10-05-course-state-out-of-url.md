# 코스 만들기 상태 URL 밖 이동 SDD

## Meta
- sdd_id: 2026-10-05-course-state-out-of-url
- date: 2026-10-05
- owner: Claude(coordinator·초안 A) / Codex(architecture gate)
- status: approved(design) — 토론 2라운드 합의 + 사용자 승인(2026-10-05), 구현: Claude(사용자 지시)
- supersedes: URL 스냅샷·서버 재준비 결정(부분 대체 — `2026-08-18-course-reroll-retry-api` 등 archive 블록), 관련 ADR-24·ADR-26
- superseded_by: -

## Scope Path
- affected routes: `/course/new` (step: time·region·purpose·loading·result·course)
- affected slices: `features/situation`(url-state·server·hooks), `features/course-result`(restore·storage), `features/course-map`, `widgets/situation`(flow controller), `shared/analytics`(isMetaBlockedUrl)
- related guides: server-client-boundary, client-logic-separation, bff, performance
- related domains: course-situation, course-result, course-map

## 현재 구조 (사실)
- 서버 `page.tsx` → `getCourseNewPageData(searchParams)`가 URL로 step·answers 복원.
  - result: URL `candidatePlaces` 있으면 사용, 없으면 **서버에서 새로 생성(submitSituation)**.
  - course: URL `selectedPlaces` 있으면 사용, 없으면 생성 후 `selectedPlaceIds`로 복원.
- loading 단계는 클라이언트 `useCourseGeneration`이 생성 → `saveLastGeneratedCourseCandidates`(sessionStorage) → "코스 보러 가기"로 result 이동(URL에 candidatePlaces·requestId 포함).
- result: `useRestoredCourseCandidates`가 sessionStorage 값을 requestId 일치 시 사용.
- 재추천: requestId로 `POST /api/situations/{requestId}/retry`.
- BE `CourseRequestSession`(Redis 24h): 조건·shownPlaceIds·retryCount만 저장, 후보 목록 미저장, 조회 API 없음.

## Design Decisions (확정)
근거: `reports/handoffs/2026-10-05-course-state-out-of-url-debate.md`

### 상태 소유·영속화
- `features/situation/model/course-flow.ts`(순수): 흐름 상태 타입·전이 함수·rev 생성/검증·스냅샷 상한/만료·zod/mini 스키마.
  - `CourseFlowState = { version: 1, revisions: Record<rev, Snapshot>, order: rev[], retries: Record<requestId, remaining>, operations: Record<opId, { status: "pending" | "done", response? }> }`
  - `Snapshot = { step, answers, requestId?, candidates, selectedPlaces, operation?: { id, kind: "initial" | "retry", requestId? }, createdAt }` — **불변**(같은 rev 덮어쓰기 금지).
  - 상한 50개·보존 24h(BE 세션 TTL과 정렬). 현재 화면 rev는 퇴출에서 보호. 퇴출·만료 rev는 복원 실패로 처리(다른 결과로 대체 금지).
- `features/situation/lib/course-flow-storage.ts`: sessionStorage(`dayro:course-flow:v1`) 읽기/쓰기, 예외 시 메모리 폴백, 스키마 검증 실패 시 빈 상태.
- 기존 `course-result/lib/generated-course-storage.ts`·`hooks/useRestoredCourseCandidates.ts`는 이 store로 대체(제거).

### 주소 계약
- `/course/new/?step=<enum>&rev=<8자>` — rev는 `crypto.getRandomValues` 기반 base36 8자, 충돌 검사.
- 조건·장소·requestId·retry·selected* 쿼리 제거. 최초 진입(`step` 없음 또는 `step=time` + rev 없음)은 빈 흐름.
- 레거시/미지 쿼리: step·rev·유입 키(utm 5·fbclid·gclid) 외 키가 있으면 서버 `page.tsx`가 유입 키만 보존해 `/course/new/?step=time`으로 redirect(생성·Meta 없음). 이관 코드 없음(운영 배포 전 전제).

### 서버/클라이언트 경계
- 서버 `getCourseNewPageData`: step·rev 정규화 + time·region 단계 지역 기준정보만 준비. **submitSituation 호출 제거**(조회 ≠ 생성), answers 정규화 제거.
- 클라이언트 `features/situation/hooks/useCourseFlowSnapshot`: `useSyncExternalStore`로 hydration 안전하게 rev 스냅샷 복원(서버 스냅샷 = restoring).
- `widgets/situation/hooks/useSituationFlowController`: 상태 전이 시 새 rev 스냅샷 기록 후 `router.push/replace(buildCourseRouteUrl({ step, rev }))`.
- restoring 동안은 고정 셸(로딩 화면) 표시, 복원 완료 후 결과·지도 마운트(`useCourseMapScreen` 초기 state 보호).

### 복원·실패 정책
- 스냅샷 없음/만료/스키마 불일치/단계 호환 불가 → 검증된 answers가 완전하면 purpose, 아니면 첫 미완료 단계로 `replace`(새 rev). 자동 생성 금지.
- 새 탭(opener 복제 포함): 유효 완료 스냅샷은 복원 허용.

### 생성·재추천 operation
- purpose 확정 → loading 스냅샷에 `operation{kind:"initial"}`, 재추천 → `operation{kind:"retry", requestId}`.
- 모듈 메모리 Promise 맵(opId)으로 같은 문서 내 재진입·StrictMode 재실행 시 재연결(새 요청 없음).
- 저장소 상태 `pending`인데 메모리 Promise 없음 = 실행 주체 상실 → 자동 재전송 금지, 토스트 "생성 결과를 확인할 수 없어요. 다시 만들 수 있어요." 후 purpose로 `replace`.
- 요청 실패 시 operation 을 `failed`로 기록 → 토스트 "코스를 만들지 못했어요. 잠시 후 다시 시도해주세요." 후 purpose로 `replace`(새로고침 후에도 동일, 자동 재전송 없음). 기존엔 loading 에 멈춤(독립 검증 P3).
- 복원 실패·중단·실패 리다이렉트는 주소(step·rev)·operation 단위로 1회만 실행(스냅샷 기록 → store 재렌더 → effect 반복 루프 방지, 독립 검증 P1).
- 성공 시 `operations[opId] = done + response`, `retries[requestId] = remainingRetries`. "코스 보러 가기" → result 스냅샷 생성 후 `replace`.
- 응답은 시작한 opId가 현재 loading 스냅샷의 opId와 같을 때만 화면 반영(이탈 후 도착 응답 무시, 저장은 수행).
- 잔여 횟수는 `retries[requestId]` 최신값, 서버 소진·만료 응답이 최종 기준(탭 간 원자성 미보장).

### 분석(#125 연계)
- 복원 경로는 이벤트 미발행(`trackGenerationSuccess`는 API 성공 시점에만).
- `isMetaBlockedUrl`: `/course/new[/]`에서 `step`(enum)·`rev`(`^[a-z0-9]{8}$`) 추가 허용, 중복 키·fragment·기타 키는 차단.
  - 중복 키·fragment 차단은 `/course/new`뿐 아니라 **전 라우트**에 적용(Meta `dl`이 fragment 포함 주소 전체를 수집하므로). 앱은 fragment 를 쓰지 않아 영향 없음(독립 검증 P3 반영). ADR-26에 "조건·장소 미전송, 일회성 탭 로컬 참조 rev 전송 허용" 명시.

### 구현 순서(한 PR)
- (a) course-flow 모델·storage·스냅샷 훅 → (b) url-state·서버 페이지·redirect → (c) controller·화면·generation·Meta·e2e·domain 문서

## Risks
- SSR → 클라이언트 복원 전환에 따른 초기 렌더·CLS·LCP 영향.
- 새로고침 시 서버 재생성 제거로 기존 "URL만으로 결과 재현" 동작 상실.
- e2e(course-new.spec)가 URL 쿼리(requestId 유지 등)를 검증 중 → 갱신 필요.

## Validation Notes
- what must be reviewed: 주소에 민감 값 부재, 새로고침·뒤로가기·재추천·저장·소진 흐름, Meta 재활성 범위, SSR/BFF 경계, 성능.
- expected evidence: unit·e2e·build·번들 예산·Lighthouse 비교.
